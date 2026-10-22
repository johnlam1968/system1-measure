// THE FLOOR GATE, AND PROOF THAT IT HAS TEETH.
//
// The gate answers one question: is the runtime inside the range this package declares in `engines.node`? It is the
// gate that turns "No such built-in module: node:sqlite" into "node 22.12.0 is outside the supported range", which
// is the difference between a reader looking for a missing dependency and a reader looking at the wrong machine.
//
// AND THE INJECTION AT THE END IS THE POINT. A gate that has never been shown to fail is a description of a gate, and
// this one is checked against the runtime that broke it: node 22.12.0, on which `node:sqlite` was still behind a
// flag, and on which this package's own suite died with a module-resolution error.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkNodeFloor, parseVersion, readManifest, satisfiesFloor } from '../core/node-floor.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST = readManifest(ROOT)
const RANGE = MANIFEST.engines.node
const SCRIPT = join(ROOT, 'scripts/check-node-floor.mjs')

/** Run the gate as a process, the way `npm test` runs it, and say what it said and what it exited with. */
function runGate(cwd, script = SCRIPT) {
    let output = ''
    let status = 0
    try {
        output = execFileSync(process.execPath, [script], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (error) {
        status = typeof error.status === 'number' ? error.status : 1
        output = `${error.stdout ?? ''}${error.stderr ?? ''}`
    }
    return { status, output }
}

test('the range this package declares is read, and it is the one the gate checks', () => {
    // THE GATE CHECKS THE SHIPPED RANGE, not a range written in a test. A test with its own range would pass while
    // the manifest declared something else, which is a gate that measures the wrong thing.
    assert.equal(RANGE, '^22.19.0 || >=24.0.0')
    assert.equal(satisfiesFloor('22.19.0', RANGE).ok, true)
})

test('a runtime inside the range is accepted, and one outside it is refused', () => {
    for (const good of ['22.19.0', '22.19.1', '22.20.0', '24.0.0', '24.19.0', '25.3.0']) {
        assert.equal(satisfiesFloor(good, RANGE).ok, true, `${good} is inside ${RANGE}`)
    }
    for (const bad of ['22.12.0', '22.18.9', '22.5.0', '23.5.0', '23.99.99']) {
        const result = satisfiesFloor(bad, RANGE)
        assert.equal(result.ok, false, `${bad} is OUTSIDE ${RANGE} and must be refused`)
        assert.match(result.problems.join(' '), /OUTSIDE the supported range/)
    }
})

test('THE RUNTIME THAT BROKE IT IS REFUSED, and the message names the floor', () => {
    // node 22.12.0 IS the version the publishing machine runs, and `node:sqlite` was unflagged in 22.13.0.
    const result = satisfiesFloor('22.12.0', RANGE)
    assert.equal(result.ok, false)
    assert.match(result.problems.join(' '), /22\.12\.0/)
    assert.match(result.problems.join(' '), /\^22\.19\.0 \|\| >=24\.0\.0/)
})

test('a range this gate cannot read is REFUSED, not assumed satisfied', () => {
    // THE MOST IMPORTANT LINE IN THIS FILE. A matcher that cannot parse a range and then answers "yes" is a gate
    // that has stopped gating, and it stops silently -- the failure mode of every gate in this package's history.
    for (const unreadable of ['~22.19.0', '22.x', '>=22.19.0 <25 || *', 'not a range']) {
        const result = satisfiesFloor('25.3.0', unreadable)
        assert.equal(result.ok, false, `"${unreadable}" must not be assumed satisfied`)
        assert.match(result.problems.join(' '), /UNKNOWN|not one this package can check/)
    }
})

test('EVERY COMPARATOR THIS GATE UNDERSTANDS IS PROVEN, ONE BY ONE', () => {
    // THE MATCHER CLAIMS TO READ SIX OPERATORS, and a claim that is not tested is a comment. Each one is checked
    // against a version that is inside it and a version that is outside it, because an operator that only ever says
    // "yes" looks exactly like an operator that works.
    const cases = [
        ['^22.19.0', '22.19.0', true],
        ['^22.19.0', '22.19.1', true],
        ['^22.19.0', '23.0.0', false],
        ['^22.19.0', '22.18.0', false],
        ['>=22.19.0', '22.19.0', true],
        ['>=22.19.0', '22.18.9', false],
        ['>22.19.0', '22.19.1', true],
        ['>22.19.0', '22.19.0', false],
        ['<=22.19.0', '22.19.0', true],
        ['<=22.19.0', '22.19.1', false],
        ['<22.19.0', '22.18.9', true],
        ['<22.19.0', '22.19.0', false],
        ['22.19.0', '22.19.0', true],
        ['22.19.0', '22.19.1', false],
    ]
    for (const [range, version, expected] of cases) {
        assert.equal(satisfiesFloor(version, range).ok, expected, `${version} against "${range}"`)
    }
})

test('an alternative joined by || is enough on its own', () => {
    // THE SHAPE `engines.node` USES: two alternatives, and the version is inside the second one.
    assert.equal(satisfiesFloor('24.0.0', '^22.19.0 || >=24.0.0').ok, true)
    assert.equal(satisfiesFloor('23.0.0', '^22.19.0 || >=24.0.0').ok, false)
    // AND ONE UNREADABLE ALTERNATIVE DOES NOT WAVE THE OTHER THROUGH -- but it IS reported, so the reader is told
    // that part of the range was not checked rather than left to assume it was.
    const mixed = satisfiesFloor('24.0.0', '>=24.0.0 || ~22.19.0')
    assert.match(mixed.problems.join(' '), /not one this package can check/)
})

test('an undeclared range is a problem, because a support window that is not stated is not a support window', () => {
    const result = satisfiesFloor('25.3.0', undefined)
    assert.equal(result.ok, false)
    assert.match(result.problems.join(' '), /not declared/)
})

test('a version that is not a version is a problem, and not a pass', () => {
    assert.equal(satisfiesFloor('not-a-version', RANGE).ok, false)
    assert.equal(parseVersion('not-a-version'), null)
    // THE PATCH IS OPTIONAL, because `22.19` is a version people write and `22.19.0` is the version node reports.
    // The two are the same version, so the gate must not read them as two different lines.
    assert.deepEqual(parseVersion('22.19'), { major: 22, minor: 19, patch: 0 })
    assert.deepEqual(parseVersion('v22.19.0'), { major: 22, minor: 19, patch: 0 })
})

test('the gate reads the manifest and the runtime it is given', () => {
    const result = checkNodeFloor(MANIFEST, { node: '22.12.0' })
    assert.equal(result.ok, false)
    assert.equal(checkNodeFloor(MANIFEST, { node: '24.19.0' }).ok, true)
})

test('the gate PASSES on a supported runtime, and says which line it is on', () => {
    // THE OTHER HALF OF THE INJECTION. A gate that always fails is as useless as one that never does, so the
    // supported case is checked too, and the message is checked because a gate that says nothing is a gate nobody
    // can trust.
    const { status, output } = runGate(ROOT)
    assert.equal(status, 0, `the gate refused a supported runtime: ${output}`)
    assert.match(output, /node-floor: node .* satisfies engines\.node/)
})

test('THE CLI EXITS 1 WHEN THE FLOOR IS ABOVE THE RUNTIME', () => {
    // THE INJECTION. The gate is run as a process -- the way `npm test` runs it -- with a manifest whose floor is
    // above this runtime. That is the same shape of fault as the one that started all this: a manifest that outruns
    // the machine it is on.
    const room = mkdtempSync(join(tmpdir(), 'node-floor-'))
    mkdirSync(join(room, 'scripts'), { recursive: true })
    mkdirSync(join(room, 'core'), { recursive: true })
    cpSync(join(ROOT, 'core/node-floor.js'), join(room, 'core/node-floor.js'))
    cpSync(SCRIPT, join(room, 'scripts/check-node-floor.mjs'))
    writeFileSync(join(room, 'package.json'), JSON.stringify({ name: 'floor-probe', version: '0.0.0', engines: { node: '>=99.0.0' } }))
    const { status, output } = runGate(room, join(room, 'scripts/check-node-floor.mjs'))
    assert.equal(status, 1, `the gate accepted a runtime below the floor: ${output}`)
    assert.match(output, /OUTSIDE the supported range/)
    assert.match(output, /install a supported node/)
})
