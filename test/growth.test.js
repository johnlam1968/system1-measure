// BLOAT IS NOT A LANGUAGE PROPERTY, AND THE BUDGET MOVED WITH THE FILES.
//
// Every other gate in this package makes an addition DECLARE itself: a file in the map, a node builtin, a row
// contract. None of them says anything about SIZE -- so a file can double across commits and no gate notices. This is
// the same gate the observer runs, over the same files, and it came with them.
//
//   SIZE is ATTRIBUTION. A file may be large, but its size must be a decision somebody recorded, with a reason. An
//   exemption that is no longer needed FAILS, so shrinking a file retires its paperwork rather than leaving it
//   behind. A budget is signed; a lint rule is argued with.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Ordinary files may not pass this without a declared exemption. */
const LIB_CEILING = 400
/** Test files carry cases rather than branching, so their ceiling is higher. */
const TEST_CEILING = 700

/**
 * Files allowed past the ceiling, each with the reason its size is a decision rather than an accumulation, and the
 * count it may not exceed. RAISING a `max` is the deliberate act this file exists to force; SHRINKING a file below
 * its ceiling must remove the entry, and the test says so.
 */
const SIZE_EXEMPTIONS = {
    'core/report.js': {
        // RAISED FROM 455 TO 465, and the gate asks for a DECISION rather than a drift. The ten lines are the export
        // of `cellOf` -- the ONE renderer of a question's cell -- and the reason it is exported is the same reason this
        // file exists: the package's files must agree. The standalone's terminal now prints a measurement's numbers
        // with this renderer instead of a second one of its own, and two renderers of the same question is the defect
        // the package exists to prevent, moved rather than fixed. The next raise should be a SPLIT, not a number.
        max: 465,
        reason: 'a measurement package is ONE artifact whose files must agree: skeleton, numbers, interpretation, '
            + 'manifest and the reproducible-file list -- and now the one renderer of a question\'s cell, so the '
            + 'terminal and the report cannot say different things about the same measurement. Splitting it invites '
            + 'the parts to disagree about the same measurement, which is the defect the package exists to prevent.',
    },
    'bin/ask.mjs': {
        // THE STANDALONE, and it is large for the same reason the observer's `scripts/ask.mjs` was: it is a CLI that
        // carries its own routes -- list, lint, ask, read a session, write a package -- and a CLI that is split across
        // files is a CLI whose files have to agree about the arguments, which is the defect the facade exists to
        // prevent. The cut worth making is by ROUTE, and it should be made when a fifth route appears, not before.
        max: 519,
        reason: 'one command with five routes, each with its own arguments and its own refusals by name. The ROUTES '
            + 'are the seam -- list, lint, ask, session, package -- and a split by route is the one to make, when a '
            + 'sixth route appears, rather than by size now.',
    },
}

/** Every `.js` file under `dir`, recursively, relative to the repository root. */
function filesUnder(dir) {
    return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
        const rel = `${dir}/${entry.name}`
        if (entry.isDirectory()) return filesUnder(rel)
        return entry.isFile() && entry.name.endsWith('.js') ? [rel] : []
    })
}

/** Lines, counted the way `wc -l` counts them, so a budget here matches what a reader sees in a terminal. */
function linesOf(rel) {
    return (readFileSync(join(ROOT, rel), 'utf8').match(/\n/g) || []).length
}

test('every file over the ceiling is a declared size decision, and no declaration is stale', () => {
    const grown = []
    // `core/`, `instrument/` and `rules/` are ONE package split across folders, so all three carry the same ceiling --
    // scanning one alone would let a file cross the line by being moved to another.
    for (const [dir, ceiling] of [['core', LIB_CEILING], ['instrument', LIB_CEILING], ['rules', LIB_CEILING], ['bin', LIB_CEILING], ['test', TEST_CEILING]]) {
        for (const rel of filesUnder(dir)) {
            const lines = linesOf(rel)
            const declared = SIZE_EXEMPTIONS[rel]
            if (declared === undefined) {
                if (lines > ceiling) grown.push(`${rel} is ${lines} lines (ceiling ${ceiling})`)
                continue
            }
            assert.ok(declared.reason.length > 40, `${rel} is exempt without a reason worth reading`)
            assert.ok(
                lines <= declared.max,
                `${rel} is ${lines} lines and its declared budget is ${declared.max}. Shrink it, or raise \`max\` in `
                + 'SIZE_EXEMPTIONS with the reason -- a budget only works if raising it is a decision.',
            )
        }
    }
    assert.deepEqual(grown, [], `over the ceiling with no declared reason: ${grown.join('; ')}`)
})

test('an exemption whose file is at or under the ceiling is paperwork that must be removed', () => {
    const stale = []
    for (const rel of Object.keys(SIZE_EXEMPTIONS)) {
        const ceiling = rel.startsWith('test/') ? TEST_CEILING : LIB_CEILING
        if (linesOf(rel) <= ceiling) stale.push(`${rel} is ${linesOf(rel)} lines, at or under ${ceiling}`)
    }
    assert.deepEqual(stale, [], `retire these exemptions: ${stale.join('; ')}`)
})
