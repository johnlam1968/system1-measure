// THE INPUT SHAPE'S CONTRACT, AND THE SHAPE IS CHECKED AGAINST IT.
//
// WHY THIS TEST EXISTS. `ROADMAP.md` §14.8 step 1: the input shape is the thing TWO hosts build -- this package's
// shape and, one day, a second host's builder -- and the plan is explicit that a shape two hosts build needs the same
// treatment the ROWS contract got, because the two producers of rows drifted (`F173`-`F180`: who spoke, the digest,
// the text, the NUL) and nothing caught them. A fixture is the answer, and the fixture is `contract.mjs`, vendored and
// digest-pinned.
//
// AND THIS IS THE PACKAGE'S HALF OF IT. The observer's `test/instrument-shape.test.js` is the SEAM test: its builder
// is the dsh bridge, and it asserts that the bridge and the shape agree. This one is the SHAPE test: it asserts that
// the shape alone produces the contract, with the two host bindings supplied as STUBS. The separation is the point --
// a shape that only agrees with itself when a particular bridge is attached is a shape that carries that bridge.
//
// THE DIGEST IS OVER THE FILE NAME AS WELL AS ITS BYTES, so a renamed fixture is a different contract rather than the
// same one under another name.
//
// THE COMPARISON IS `deepStrictEqual` AND THAT IS THE POINT. The shape distinguishes a key that is ABSENT from a key
// that is PRESENT AND HOLDS NOTHING, and only a strict comparison tells the two apart -- a loose one would accept a
// builder that dropped every undefined-valued key, which is a shape that reads as a measurement and is not one.
//
// THE TWO HOST-OWNED VALUES ARE PROJECTED OUT, AND THE PROJECTION IS THE WHOLE OF THE HOST-SPECIFIC PART. The harness
// event a point attaches to is the host's own fact, and the session-scope predicate is a FUNCTION; the fixture holds a
// placeholder for each and pins the predicate's ANSWERS case by case. Everything else -- every key, every group, every
// absence -- is compared exactly.
//
// AND THE TEETH ARE PROVEN ELSEWHERE, BY A GATE RATHER THAN BY A PARAGRAPH: `scripts/check-contract-teeth.mjs` mutates
// the shape, in a copy of the tree, and fails if any mutation leaves this contract green. That script is the other
// half of this file: the fixture says what the rules are, and the script says the fixture can see them break.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { instrumentShape } from '../core/instrument-shape.js'
import { FIXTURE_DIGEST, cases, digestOf } from '../contract/index.js'

/** The contract's own fixture, and the digest the contract computes for it. */
const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), '..', 'contract', 'fixture')

/**
 * THE PINNED DIGEST, and it is over the file NAME as well as its bytes: a fixture that was renamed is a different
 * contract, and a digest over the content alone would not notice.
 */
const PINNED_DIGEST = 'a1a45d16ca9f645677fd07315d3af95f9499c20b32c1d7b2765087225c30299a'

const FIXTURE_FILES = ['fixture/contract.mjs']

/** The two host-owned values, as placeholders: the fixture holds one for each and compares nothing else. */
const HOST_EVENT = '<host-event>'
const PREDICATE = '<predicate>'

/** The shape, with the two host-owned values projected out, so everything else is compared exactly. */
const project = (built) => ({
    ...built,
    point: { ...built.point, hostEvent: HOST_EVENT },
    subjects: { observed: PREDICATE },
})

/**
 * THE BINDINGS A HOST SUPPLIES, and here they are STUBS: the shape is the package's, and a package cannot know a
 * harness's event names. The stubs are what the fixture's placeholders stand for.
 */
const STUB_BINDINGS = {
    describePoint: (seam, enabled) => ({ id: seam, hostEvent: 'host/event', enabled }),
    observed: () => true,
}

/**
 * The options a case is read with. A case that names no transport is read with none, because the transport default is
 * one of the rules the contract holds -- a caller that names nothing gets the service transport.
 */
const optionsOf = (one) => (one.transport === undefined
    ? { point: one.point }
    : { point: one.point, transport: one.transport })

test('THE SHIPPED FIXTURE IS THE CONTRACT, and the digest says so', () => {
    assert.equal(digestOf(FIXTURE), PINNED_DIGEST,
        'the shipped fixture is not the one the contract pins; update it and the digest together')
    // AND THE NUMBER THE PACKAGE PUBLISHES IS THE SAME ONE, because a second host reads THAT and not this file.
    // Two pins of one number, in two places, that must agree: the test's literal is the pin, and the export is what
    // a consumer gets.
    assert.equal(FIXTURE_DIGEST, PINNED_DIGEST,
        'the digest the package exports is not the one this test pins; a second host would be told a wrong number')
})

test('THE PURE SHAPE PRODUCES THE CONTRACT\'S SHAPE, case by case', () => {
    for (const one of cases) {
        const built = instrumentShape(one.config, { ...optionsOf(one), ...STUB_BINDINGS })
        assert.deepStrictEqual(project(built), one.expected, `the shape is wrong: ${one.name}`)
    }
})

test('A FOREIGN BINDING CHANGES THE ONE VALUE IT OWNS, AND NOTHING ELSE', () => {
    // THE CLAIM THE SHAPE MAKES. A second host binds the same two functions and gets the same shape, with its OWN
    // harness event where the first host's would be. If the shape carried anything else host-specific, this is where
    // it would show.
    const foreign = { describePoint: (seam, enabled) => ({ id: seam, hostEvent: 'pi/turn', enabled }), observed: () => true }
    for (const one of cases) {
        const built = instrumentShape(one.config, { ...optionsOf(one), ...foreign })
        assert.equal(built.point.hostEvent, 'pi/turn', 'the host owns the event name')
        assert.deepStrictEqual(project(built), one.expected, `the shape is wrong: ${one.name}`)
    }
})

test('THE SCOPE PREDICATE IS THE HOST\'S, AND THE SHAPE ONLY CARRIES IT', () => {
    // THE ANSWERS ARE NOT THE PACKAGE'S TO PIN. The fixture holds a scope probe list with the answer each probe gets,
    // and those answers are the HOST's -- the dsh scope reader's, in the observer. A package that asserted them would
    // be asserting a fact about a harness it has never heard of, and the assertion would have to be deleted the moment
    // a second host bound a different scope.
    //
    // So the shape's own claim is narrower and it is the one that can be made from here: the scope is a PREDICATE, it
    // is passed through untouched, and it is called with the argument the caller gave it.
    const asked = []
    // THE BINDING'S SIGNATURE IS `(config, agentId)`: the host's scope rule needs the row's own settings as well as
    // the session, because "in scope" is a fact about the row and the session together.
    const bindings = { ...STUB_BINDINGS, observed: (_source, id) => { asked.push(id); return true } }
    for (const one of cases) {
        const built = instrumentShape(one.config, { ...optionsOf(one), ...bindings })
        assert.equal(typeof built.subjects.observed, 'function', `the scope is a predicate: ${one.name}`)
    }
    const built = instrumentShape({}, { point: 'draft', ...bindings })
    built.subjects.observed('session-anything')
    assert.deepEqual(asked, ['session-anything'], 'and the predicate is called with the argument the caller gave it')
    // AND THE OBSERVER PINS THE ANSWERS, in its own `test/instrument-shape.test.js`, against the same fixture and the
    // same digest -- which is why the fixture is one file with one digest and two readers.
})

test('THE SCOPE BINDING RECEIVES A RECORD, ALWAYS', () => {
    // THE NORMALISED CONFIG, and not the raw argument. A row's config is a record; a caller that passes something
    // else gets an EMPTY record rather than the thing it passed, because the scope rule is the HOST's and it must
    // never be handed a value the shape has not looked at. This is a shape-level fact, and it is the one the
    // `isRecord` guard buys: without it the binding would be asked about a string.
    let seen = null
    const bindings = { ...STUB_BINDINGS, observed: (source) => { seen = source; return true } }
    const built = instrumentShape('not a record', { point: 'draft', ...bindings })
    built.subjects.observed('session-anything')
    assert.deepEqual(seen, {}, 'the binding is handed the normalised record, not the raw argument')
})

test('THE HOST EVENT IS A NON-EMPTY STRING, because the trace writes it down', () => {
    // The TYPE of the ONE HOST-SPECIFIC VALUE, which the fixture cannot hold: a placeholder says "a string is here",
    // not "a string is here and it says something".
    for (const one of cases) {
        const built = instrumentShape(one.config, { ...optionsOf(one), ...STUB_BINDINGS })
        assert.equal(typeof built.point.hostEvent, 'string', `the host event is a string: ${one.name}`)
        assert.notEqual(built.point.hostEvent, '', `the host event says something: ${one.name}`)
    }
})
