// SYSTEM1-MEASURE -- the measurement, and nothing else.
//
// WHAT THIS PACKAGE IS. The machinery that asks a model questions and turns the answers into a reading: the
// question sets, the composition, the chain that judges a subject in parts, the producer that normalizes a session
// log into rows, the reader that checks those rows, and the format vocabulary they all speak.
//
// WHAT THIS PACKAGE IS NOT. It is not a harness plugin, and it does not know what a harness is. There is no `ctx` in
// this tree, no event name from any host, and no dependency of any kind: the package's `package.json` has an empty
// `dependencies` block, and `test/instrument-boundary.test.js` walks the closure from `bin/ask.mjs` to prove it.
//
// THE RULES HAVE THEIR OWN PATH. `system1-measure/rules` is where the row contract lives -- the row kinds, the roles,
// the message types, the NUL rule, the fixture and its digest. They are not re-exported here on purpose: a rule
// stated in two places is a rule that will be changed in one of them, and the other repository that depends on it
// will not be told.
//
// THE SUBPATH EXPORTS ARE THE WHOLE API. `./core/*` and `./instrument/*` are open on purpose: the two halves are
// separable, and a consumer that needs only the format's vocabulary should not have to take the measurement with it.

export { composeQuestions, askQuestions, wireTransport, listQuestionSets, writeQuestionSet, renderAnswerLines, WRITABLE_SCOPES, MACHINE_UNCOVERED } from './core/system1.js'
export { instrumentShape, questionGroup, redactionGroup, declaredAxes } from './core/instrument-shape.js'
export { judgeSegments, judgeOnce, measurementSummary, segmentBudgetFor } from './instrument/measure.js'
export { normalizeEvents } from './instrument/normalize.js'
export { readRowsJsonl, validateRows, rowsSummary, receiptOf, exchangesOfRows, segmentsOfRows } from './core/session-rows.js'
export { buildPackage, buildSkeleton, writePackage, packageId, defaultPackageDir } from './core/report.js'
