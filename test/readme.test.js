// THE README IS A FRONT PAGE, AND THAT IS ENFORCED RATHER THAN PROMISED.
//
// The rule is not this repository's taste: it is the OTHER repository's measured one. `dsh-system1-observer` grew a
// 775-line, 8,490-word README, and a judged evaluation said what that costs -- as a front page it read as a
// CONTRIBUTOR document (0.57, against 0.27 for a first-time visitor), carried internal plumbing at 0.97, offered no
// install command in its first screen (0.13) and no way to ask for help (0.08), and graded 1.91 of 4 for the audience
// GitHub and opensource.guide describe. The landing page that replaced it graded 3.26 of 4. The measurement, and its
// limits, are in `dsh-system1-observer:docs/readme-standards.md`; the worked example is
// `dsh-system1-observer:docs/case-study-readme-review.md`.
//
// So the limit is not taste. 100 lines is the length at which the Standard Readme specification starts REQUIRING a
// table of contents -- at or below it, a README is still a single-screen document -- and GitHub's own guidance points
// the same way: a README carries what a developer needs to get started, and "longer documentation is best suited for
// wikis".
//
// A FAILING TEST HERE IS NOT A NUISANCE. It means reference material, a seam table or an API list is sitting where a
// first-time visitor has to walk past it. The fix is to MOVE it -- to `docs/extending.md` for the seams and the API,
// to `docs/README.md` for the index of documents -- and never to raise this number without re-measuring the audience
// question in the standards document.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8')
const lines = readme.split('\n').length - (readme.endsWith('\n') ? 1 : 0)
const words = readme.split(/\s+/).filter(Boolean).length

/** Deliberately below the point where Standard Readme requires a table of contents, with room for an honest edit. */
const MAX_LINES = 100
const MAX_WORDS = 800

const WHERE = 'Move the material to docs/extending.md (the seams and the API), docs/README.md (the index of documents), '
  + 'or core/README.md (the map). Do not raise this limit without re-measuring the audience question in '
  + 'dsh-system1-observer:docs/readme-standards.md.'

test('the README stays a front page: at most ' + MAX_LINES + ' lines', () => {
    assert.ok(lines <= MAX_LINES, `README.md is ${lines} lines, over the ${MAX_LINES}-line cap. ${WHERE}`)
})

test('the README stays a front page: at most ' + MAX_WORDS + ' words', () => {
    // LINES ALONE ARE NOT A LIMIT: 100 long lines can hold a manual. The word ceiling is what makes the line cap real.
    assert.ok(words <= MAX_WORDS, `README.md is ${words} words, over the ${MAX_WORDS}-word cap. ${WHERE}`)
})

test('every repository link in the README is absolute, because npm renders this same file', () => {
    // npm shows the README from the tarball, where a relative link resolves against npmjs.com and breaks -- and the
    // Standard Readme specification requires that a README "must not contain broken links". Absolute links work on
    // both surfaces, so there is one front page instead of two documents to keep in agreement.
    const targets = [...readme.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1])
    const relative = targets.filter((t) => !t.startsWith('http') && !t.startsWith('#'))
    assert.deepEqual(relative, [], 'README.md links relatively to ' + relative.join(', ')
        + ': use the full https://github.com/johnlam1968/system1-measure/blob/master/<path> URL.')
})

test('the long documentation exists, and the README points a reader at it', () => {
    // The length cap is only honest if what leaves the front page LANDS somewhere a reader can follow.
    for (const doc of ['docs/extending.md', 'docs/README.md', 'docs/session-log-format.md']) {
        assert.ok(existsSync(join(ROOT, doc)), `${doc} is missing: the cap would have nowhere to put things`)
    }
    assert.match(readme, /docs\/extending\.md/, 'the README must link to docs/extending.md, or the moved material is unreachable')
})

test('the README says where to ask for help', () => {
    // MEASURED, and the single largest move in the whole exercise: the help path scored 0.08 on the manual and 0.11
    // on the first landing page, and 0.99 once a paragraph and an issues link were there. It is the one line that
    // moved a question by a large, repeatable margin, so it is the one line this gate holds.
    // THE LINK, NOT THE WORD -- see the same gate in the observer: matching /issues/ passes a page whose issues link
    // is gone, because the word appears elsewhere. A gate that checks a word is not a gate on the thing.
    assert.match(readme, /https:\/\/github\.com\/[^)\s]+\/issues/, 'the README must link to the issue tracker: a reader who cannot ask is stuck')
    assert.match(readme, /pull requests? are welcome|\]\([^)]*CONTRIBUTING[^)]*\)/i,
        'the README must say how to contribute -- a heading alone is not a way to contribute')
})

test('the short description is one line, and it is the package description', () => {
    // THE CASE STUDY's finding, adopted for its own reason: the GitHub description, the npm description and the
    // README's short description become ONE string with ONE source of truth, and the string is short enough to be a
    // summary rather than a paragraph.
    const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    const oneLiner = readme.split('\n').find((l) => l.startsWith('> '))
    assert.ok(oneLiner, 'the README must open with a one-line description, as a blockquote')
    const text = oneLiner.slice(2).trim()
    assert.ok(text.length <= 120, `the short description is ${text.length} characters, over 120`)
    assert.equal(text, manifest.description, 'the README short description and the package description are one string')
})

test('the front page does not carry the project\'s internal vocabulary', () => {
    // THE MEASURED LESSON, and the one that is easiest to repeat: the first landing page's cautions were written in the
    // PROJECT's own words -- "seams", "the probe", "a question set" -- and the judge read internal plumbing at 0.75 for
    // a first-time visitor; rewritten in the reader's words it read 0.35. So the words that only mean something to
    // someone working ON the project do not belong on the front page.
    //
    // The API's own names are exempt, because a reader has to TYPE them to call anything. The words below are the
    // project's internals, and each of them is a word a visitor has no reason to know.
    const internals = ['the probe', 'the teeth', 'check-contract-teeth', 'coverage floor', 'F19', 'rules/index',
        'instrumentShape', 'judgeSegments', 'segmentsOfRows', 'question-dsl', 'label-hash', 'nudge-label',
        'npm run ', 'docs/findings.md', 'the register']
    const found = internals.filter((word) => readme.includes(word))
    assert.deepEqual(found, [], 'the front page carries internal vocabulary: ' + found.join(', ')
        + '. Say it in the reader\'s words, and put the detail in docs/extending.md.')
})
