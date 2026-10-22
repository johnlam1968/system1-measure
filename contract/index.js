// THE INPUT SHAPE'S CONTRACT, AND IT IS PUBLISHED SO A SECOND HOST CAN PROVE IT.
//
// WHAT THIS IS. The fixture that says what the measurement's one input object must be, for a second host that
// builds it. The shape is the thing TWO hosts build -- this package's shape and, one day, another harness's builder
// -- and the plan is explicit that a shape two hosts build needs the same treatment the ROW contract got, because
// the two producers of rows drifted (`F173`-`F180`: who spoke, the digest, the text, the NUL) and nothing caught
// them.
//
// WHY IT IS PUBLISHED, AND NOT LEFT IN `test/`. A fixture that a second host cannot read is a fixture that pins
// nothing outside the repository that wrote it. The whole point of a contract is that somebody ELSE can check
// themselves against it, and a second host cannot check itself against a file that was not shipped. So the fixture
// travels, and the DIGEST travels with it -- a fixture that travels without its digest protects nothing, because a
// renamed fixture is a different contract.
//
// WHY IT IS `.mjs` AND NOT JSON. The shape distinguishes a key that is ABSENT from a key that is PRESENT AND HOLDS
// NOTHING, and JSON has no `undefined`: a sentinel string cannot say that, and can collide with a real value
// (**F192**).
//
// AND THE COMPARISON IS `deepStrictEqual`, which is the only comparison that tells the two apart: a loose one would
// accept a builder that dropped every undefined-valued key, which is a shape that reads as a measurement and is
// not one.
//
// THE TWO HOST-OWNED VALUES ARE PROJECTED OUT, and the projection is the whole of the host-specific part. The
// harness event a point attaches to is the host's own fact, and the session-scope predicate is a FUNCTION; the
// fixture holds a placeholder for each and pins the predicate's ANSWERS case by case. Everything else -- every key,
// every group, every absence -- is compared exactly.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cases } from './fixture/contract.mjs'

// THE CASES THEMSELVES, re-exported so a consumer needs ONE import and not two: the fixture's data and the
// contract's own bookkeeping (the digest, the file names, the digest of a vendored copy) belong together.
export { cases }

const HERE = dirname(fileURLToPath(import.meta.url))

/**
 * The fixture's file, and the name it is digested under.
 *
 * THE NAME IS PART OF THE DIGEST, and that is deliberate: a fixture that was renamed is a different contract, and a
 * digest over the content alone would not notice. The name is relative to THIS directory, which is the same
 * convention the rules' own fixture uses -- `rules/fixture/session.v4.jsonl` is digested as
 * `fixture/session.v4.jsonl`.
 */
export const FIXTURE_FILES = Object.freeze(['fixture/contract.mjs'])

/**
 * THE PINNED DIGEST, over the file NAME as well as its bytes.
 *
 * It is a NUMBER IN THE REPOSITORY, and a test asserts it against the file's own digest, so a fixture edited
 * without its digest fails rather than passing quietly.
 */
export const FIXTURE_DIGEST = 'a1a45d16ca9f645677fd07315d3af95f9499c20b32c1d7b2765087225c30299a'

/**
 * The digest of a fixture held ELSEWHERE, so a repository that vendors the contract can prove it is the same bytes.
 *
 * @param root  the directory holding `contract.mjs`
 * @returns {string} 64 hex characters
 */
export function digestOf(root) {
    const hash = createHash('sha256')
    for (const file of FIXTURE_FILES) {
        hash.update(file)
        hash.update(readFileSync(join(root, file.split('/').pop())))
    }
    return hash.digest('hex')
}

/**
 * The contract's cases, read from the fixture that ships with this package.
 *
 * @returns {object[]} one case per shape, each with `config`, `point`, `transport`, `expected` and `scope`
 */
export function contractCases() {
    return cases
}

/** The fixture's own bytes, for a consumer that wants to vendor them verbatim. */
export function contractBytes() {
    return readFileSync(join(HERE, 'fixture', 'contract.mjs'))
}
