// WHETHER THIS RUNTIME IS ONE THIS PACKAGE SUPPORTS.
//
// WHY THIS EXISTS, AND IT IS A GAP RATHER THAN A FEATURE. `engines.node` is the declaration of what this package
// supports, and npm treats it as a WARNING: `npm install` on an unsupported node prints a yellow line and carries
// on. So a machine that is too old finds out the hard way -- and MEASURED, on the node 22.12.0 that runs the
// publishing machine: the suite died with
//
//     Error [ERR_UNKNOWN_BUILTIN_MODULE]: No such built-in module: node:sqlite
//
// which says the CODE is missing a module. It does not say the RUNTIME is missing a version. The reader goes looking
// for a dependency, and the dependency is not what is wrong: `node:sqlite` was unflagged in node 22.13.0
// (nodejs/node#55890), so 22.12.0 is the last line on which `import { DatabaseSync } from 'node:sqlite'` throws at
// load time, and this package's floor is `^22.19.0 || >=24.0.0`.
//
// SO A GATE THAT SAYS WHAT IS WRONG, run FIRST, before anything that would fail cryptically. A floor check that runs
// after the tests is a floor check that never runs: the crash happens first, and the crash is the error the reader
// sees.
//
// AND IT IS HERE, IN `core/`, AND NOT IN THE SCRIPT, because a gate nothing tests is a gate that rots. The script is
// the CLI half; the judgement is a pure function that this repository's own tests can call with a version they
// choose.
//
// THE RANGE IS A SMALL, STATED SUBSET of node's semver ranges, and it is stated here rather than assumed: `^`,
// `>=`, `>`, `<=`, `<` and an exact version, joined by `||`. **A RANGE THIS DOES NOT UNDERSTAND IS A PROBLEM, NOT A
// PASS.** A matcher that cannot parse a range must say so, because the alternative -- treating it as satisfied --
// turns a gate into a comment, and a comment does not stop a publish.
import { readFileSync } from 'node:fs'

/**
 * A version as three numbers, or null when the text is not a version.
 *
 * THE PATCH IS OPTIONAL, because `22.19` is a version people write and `22.19.0` is the version node reports.
 */
export function parseVersion(text) {
    if (typeof text !== 'string') return null
    const m = /^v?(\d+)\.(\d+)(?:\.(\d+))?$/.exec(text.trim())
    if (!m) return null
    return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3] ?? 0) }
}

/** Two versions, compared. */
function compare(a, b) {
    if (a.major !== b.major) return a.major - b.major
    if (a.minor !== b.minor) return a.minor - b.minor
    return a.patch - b.patch
}

/**
 * ONE ALTERNATIVE of a range, as a predicate over a version.
 *
 * Returns null for an alternative this does not understand, so the caller can refuse it rather than wave it through.
 */
function comparator(text) {
    const m = /^\s*(>=|<=|>|<|\^|=)?\s*(\d+\.\d+(?:\.\d+)?)\s*$/.exec(text)
    if (!m) return null
    const op = m[1] ?? ''
    const bound = parseVersion(m[2])
    if (!bound) return null
    if (op === '^') {
        // `^22.19.0` IS `>=22.19.0 <23.0.0`: the same MAJOR, and not older. The zero-major case is not special-cased,
        // because this package does not use it and a rule that is right for one and wrong for another is a rule that
        // is wrong somewhere.
        return (v) => compare(v, bound) >= 0 && v.major === bound.major
    }
    if (op === '>=') return (v) => compare(v, bound) >= 0
    if (op === '>') return (v) => compare(v, bound) > 0
    if (op === '<=') return (v) => compare(v, bound) <= 0
    if (op === '<') return (v) => compare(v, bound) < 0
    return (v) => compare(v, bound) === 0
}

/**
 * WHETHER A VERSION SATISFIES A RANGE.
 *
 * Returns `{ ok, problems, notes }` rather than a boolean, because the two reasons this can fail are different and
 * a reader needs to tell them: a version that is simply too old, and a range this package cannot check.
 */
export function satisfiesFloor(version, range) {
    const problems = []
    const notes = []
    const v = parseVersion(version)
    if (!v) {
        problems.push(`the runtime version "${version}" is not a version this can read`)
        return { ok: false, problems, notes }
    }
    if (typeof range !== 'string' || range.trim() === '') {
        problems.push('engines.node is not declared, so the supported range is unstated')
        return { ok: false, problems, notes }
    }
    const alternatives = range.split('||')
    const usable = []
    for (const alternative of alternatives) {
        const test = comparator(alternative)
        if (!test) {
            problems.push(`the range "${alternative.trim()}" is not one this package can check, so the floor is UNKNOWN and is not assumed to be satisfied`)
            continue
        }
        usable.push(test)
    }
    if (usable.length === 0) {
        problems.push('the declared range could not be read, so the floor is UNKNOWN and is not assumed to be satisfied')
        return { ok: false, problems, notes }
    }
    if (usable.some((test) => test(v))) {
        notes.push(`node ${version} is inside the supported range ${range}`)
        return { ok: true, problems, notes }
    }
    problems.push(`node ${version} is OUTSIDE the supported range ${range}`)
    return { ok: false, problems, notes }
}

/**
 * THE FLOOR OF A MANIFEST, CHECKED AGAINST A RUNTIME.
 *
 * `manifest` is the parsed `package.json` and `runtime` carries the running node version. The manifest is read here
 * rather than passed in, so a caller cannot check a range that is not the one it ships.
 */
export function checkNodeFloor(manifest, runtime = {}) {
    const version = runtime.node ?? process.versions.node
    const range = manifest?.engines?.node
    const { ok, problems, notes } = satisfiesFloor(version, range)
    if (!ok) {
        notes.push(`node ${version} was measured; the floor says ${range}`)
    }
    return { ok, problems, notes }
}

/**
 * THE MANIFEST OF A DIRECTORY, read.
 *
 * The CLI half reads the manifest this way so that the range checked is the range shipped.
 */
export function readManifest(root) {
    return JSON.parse(readFileSync(`${root}/package.json`, 'utf8'))
}
