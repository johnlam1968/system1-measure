// A PATH NAMED IN A DOCUMENT MUST EXIST. The map's own gate checks the entries -- the `* \`file.js\`` bullets --
// and it checks them BOTH ways, so a file cannot be undeclared and a name cannot be a phantom. But the PROSE was
// never checked, and prose is where a stale path survives longest: the map was rewritten for this package and
// still named the observer's `lib/`, the old `dsh/session-adapter/`, and a `test/fixtures/` contract that has
// moved to `contract/fixture/`. Every one of those was a reader being sent to a file that is not here.
//
// THE RULE: a backticked token that LOOKS LIKE A PATH (it has a directory part and a code-ish extension) must
// either resolve to a file in this package, or name the repository it lives in -- `dsh-system1-observer:dsh/x.js`.
// The second form is not an escape hatch; it is the form that tells a reader where the file actually is, and the
// known repositories are listed here so a typo cannot become a citation.
//
// The cost of this gate is that a document cannot mention a file that does not exist yet -- which is the point.
// A document that names a file before it is written is a promise, and a promise in a README is a debt.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The repositories a document may point at. A path into one of them must SAY which one it is. */
const KNOWN_REPOS = ['dsh-system1-observer', 'dsh-session-index', 'pi-session-log', 'dsh-session-rows']

/** The folders of this package a path may be written relative to. */
const ROOTS = ['', 'core/', 'instrument/', 'rules/', 'contract/', 'bin/', 'scripts/', 'docs/', 'test/', 'criteria/']

/** Every document that is shipped, and therefore every document a reader can be sent to. */
function documents() {
    const docs = [join(ROOT, 'README.md'), join(ROOT, 'AGENTS.md'), join(ROOT, 'core/README.md')]
    for (const name of readdirSync(join(ROOT, 'docs'))) {
        if (name.endsWith('.md')) docs.push(join(ROOT, 'docs', name))
    }
    return docs
}

/**
 * A token that LOOKS like a path: it has a directory part and ends in a code-ish extension.
 *
 * Two kinds of token are NOT claims about a file, and both are recognised by their shape:
 * a PLACEHOLDER (`~/.pi/<agent>/sessions/<slug>.jsonl`) names a shape, not a file -- and a shape that is not
 * a file cannot be missing; and a GLOB (`core/*-tool.js`) names a SET of files, which is checked as a set.
 */
function looksLikePath(token) {
    if (!token.includes('/')) return false
    if (!/\.(js|mjs|cjs|json|jsonl|md|yml|yaml)$/.test(token)) return false
    if (token.includes('<') || token.includes('>') || token.startsWith('~')) return false
    return true
}

/** Does the glob match at least one file in this package? A glob that matches nothing is a claim about no file. */
function globMatches(token) {
    const pattern = new RegExp('^' + token.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$')
    for (const root of ROOTS) {
        const dir = join(ROOT, root)
        if (!existsSync(dir)) continue
        for (const name of readdirSync(dir)) {
            if (pattern.test(root + name)) return true
        }
    }
    return false
}

/** Does this path exist in this package, written relative to any of its folders? */
function resolvesInPackage(token, from) {
    if (existsSync(join(from, token))) return true
    for (const root of ROOTS) {
        if (existsSync(join(ROOT, root, token))) return true
    }
    return false
}

test('every path a document names exists in this package, or names the repository it lives in', () => {
    const offenders = []
    for (const doc of documents()) {
        const from = dirname(doc)
        const text = readFileSync(doc, 'utf8')
        // Backticked tokens only: a path in the prose is a claim about a file, and a claim is what this checks.
        // A markdown LINK's target is not in backticks, and a link is checked by its own rule (the link test).
        for (const match of text.matchAll(/`([^`\s]+)`/g)) {
            const token = match[1]
            if (!looksLikePath(token)) continue
            // A path into another repository: the form is `<repository>:<path>`, and the repository must be one we
            // know -- otherwise `typo:whatever` would satisfy the rule without saying anything.
            const colon = token.indexOf(':')
            if (colon > 0) {
                const repo = token.slice(0, colon)
                if (KNOWN_REPOS.includes(repo)) continue
                offenders.push(`${doc.replace(ROOT + '/', '')}: unknown repository in \`${token}\``)
                continue
            }
            if (resolvesInPackage(token, from)) continue
            if (token.includes('*') && globMatches(token)) continue
            offenders.push(`${doc.replace(ROOT + '/', '')}: \`${token}\` names no file in this package`)
        }
    }
    assert.deepEqual(offenders, [], offenders.join('\n'))
})

test('the documents that ship are the ones that are checked', () => {
    // The gate above is only as good as its list, so the list is pinned: a new document is checked from the day it
    // is added, and a document that is deleted is not checked any more (and must not be shipped).
    const shipped = documents().map((d) => d.replace(ROOT + '/', '')).sort()
    assert.ok(shipped.includes('README.md'), 'the landing page is checked')
    assert.ok(shipped.includes('docs/extending.md'), 'the extending guide is checked')
    assert.ok(shipped.includes('core/README.md'), 'the map is checked')
})
