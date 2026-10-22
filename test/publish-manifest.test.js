// THE MANIFEST MUST BE ONE NPM WILL PUBLISH AS WRITTEN.
//
// WHY THIS FILE EXISTS. npm "auto-corrects" a manifest at publish time and says so only in a WARNING. A manifest
// that npm rewrites publishes something OTHER than what the repository says, and the warning is printed among
// hundreds of lines of tarball contents, where it is read by nobody.
//
// MEASURED, on this package's own first publish attempt: the `bin` entry was written the way npm's own
// documentation writes it -- `"system1-ask": "./bin/ask.mjs"` -- and npm's publish path did this:
//
//     npm warn publish npm auto-corrected some errors in your package.json when publishing.
//     npm warn publish errors corrected:
//     npm warn publish "bin[system1-ask]" script name bin/ask.mjs was invalid and removed
//
// IT REMOVED THE ENTRY. The auto-correct STRIPS the leading `./` and then rejects what it stripped, because a bin
// path is only valid if it starts with `./` OR contains no slash at all -- and `bin/ask.mjs` is neither. The result
// was a package published with NO COMMAND: the file shipped, because `files` carried it, and the executable link did
// not, because npm deleted it. `npm i -g system1-measure` would have installed a package with no `system1-ask`.
//
// AND `npm pkg fix` -- npm's own repair -- produces the form that publishes: it rewrites `./bin/ask.mjs` to
// `bin/ask.mjs`. So the two npm tools disagree, and the one that runs at publish time wins. The manifest is written
// the way `npm pkg fix` writes it, and this test holds it there.
//
// THE GENERAL GATE IS THE FIRST TEST, and it is the one that matters: it runs npm's own publish path and fails if
// npm would rewrite ANYTHING. A test that only checked the `bin` field would have passed the day npm started
// auto-correcting a different field.
//
// `--ignore-scripts` IS NOT OPTIONAL. `prepublishOnly` runs `npm run ci`, which runs this test, so a publish that
// ran its scripts would recurse into itself forever. Ignoring scripts is also what makes the check cheap: no tarball
// is built and no gate is re-run.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

/**
 * WHETHER A `files` PATTERN CARRIES A PATH, the way npm's own matcher does.
 *
 * npm's `files` is a list of GLOBS, and `bin/ask.mjs` is carried by the pattern `bin/*.mjs` -- a check that compared
 * the two as strings would say the command is missing from the package while npm ships it. So the pattern is
 * translated to a regular expression the way a glob is: `*` is any run of characters within a path segment, and `**`
 * is any run of characters including separators.
 */
function matches(pattern, path) {
    if (pattern === path) return true
    const source = pattern
        .split('**')
        .map((part) => part.split('*').map((chunk) => chunk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*'))
        .join('.*')
    return new RegExp(`^${source}$`).test(path)
}

test('npm would publish this manifest AS WRITTEN, with nothing auto-corrected', () => {
    // BOTH STREAMS ARE READ, and that is not a detail: npm prints its auto-correction warning on STDERR, and
    // `execFileSync` RETURNS STDOUT ONLY. A check that read stdout would see a clean publish and report success --
    // the gate that checks a word and not the thing, wearing the gate's clothes. `spawnSync` hands back both.
    const run = spawnSync('npm', ['publish', '--dry-run', '--ignore-scripts'], { cwd: ROOT, encoding: 'utf8' })
    const output = `${run.stdout ?? ''}${run.stderr ?? ''}`
    if (run.status !== 0) {
        assert.fail(`npm publish --dry-run failed, so the manifest was not checked: ${output}`)
    }
    // The two lines npm prints when it rewrites something. Both are needed: the first says THAT it corrected, the
    // second says WHAT, and the second is the one that names the field.
    assert.doesNotMatch(output, /auto-corrected some errors/, 'npm would rewrite this manifest at publish time, and the published package would not be the one in this repository')
    assert.doesNotMatch(output, /was invalid and removed/, 'npm would remove an entry from this manifest at publish time')
})

test('every bin entry names a file that is here, and names it the way npm will accept it', () => {
    for (const [name, target] of Object.entries(manifest.bin ?? {})) {
        // THE `./` PREFIX IS WHAT npm's auto-correct STRIPS, and what it then rejects. `npm pkg fix` writes the path
        // without it, and that is the form that publishes.
        assert.ok(!target.startsWith('./'), `bin["${name}"] is "${target}"; npm strips the "./" and then removes the entry as invalid, so the command would not be installed`)
        assert.ok(existsSync(join(ROOT, target)), `bin["${name}"] names "${target}", which is not in this repository`)
        assert.ok(
            (manifest.files ?? []).some((pattern) => matches(pattern, target)),
            `bin["${name}"] names "${target}", which \`files\` does not carry, so the command would be installed without its file`,
        )
    }
})

test('the published manifest declares no dependency, because a clean room is the claim', () => {
    // `AGENTS.md` says this package must never grow a runtime dependency, and says the tarball gate checks the
    // PUBLISHED manifest rather than the working tree. `test/instrument-boundary.test.js` asserts the working
    // manifest; this asserts the one that leaves, because a publish is the moment the manifest becomes a promise.
    assert.deepEqual(Object.keys(manifest.dependencies ?? {}), [])
})
