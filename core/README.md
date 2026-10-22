# The map: `core/`, `instrument/`, `rules/` and `contract/`

The map of this package, grouped by what a reader is trying to do rather than by topic. **It is enforced**: a test
scans the four folders recursively and fails if a file is not named here, or if a name here does not exist -- so a new
file must be declared, exactly as a new host call must be declared in a harness plugin. **And the prose is enforced
too**: a path named in any page of this package must exist in this package, or carry the name of the repository it
lives in, because a map that names files that are not here teaches a reader to look in the wrong place.

Two things this map deliberately does **not** carry, because something else already owns them:

* **which files touch a harness** -- there are none, and that is measured rather than asserted:
  `test/instrument-boundary.test.js` walks every module's imports and fails a bare specifier that is not a node
  builtin.
* **line counts and percentages** -- those move with every edit; a number here would be wrong within a week.

Paths are relative to their own folder: a module in `core/` is named bare (`questions.js`), a module in `instrument/`
carries its `instrument/` prefix (`instrument/measure.js`), and the rules and the contract carry theirs
(`rules/index.js`, `contract/index.js`) -- which is the same name the code and the gates use.

**AND THE SEAMS ARE THE USAGE.** Everything a host has to supply is a parameter, never an import, and there are
seven of them: the two bindings of the input shape, the cut, the transport, the question sets, the producer, the
tools and the portable package. **`docs/extending.md` is the list**, with the code and the contract each one obeys.
This map says what each FILE is; that document says how to BIND them.

**AND THE PACKAGE HAS NO HARNESS IN IT.** There is no `ctx` anywhere in this tree, no host event name, and no
dependency of any kind: `package.json` declares none, and the boundary test says so from the tree rather than from
this sentence. What binds a measurement to a harness lives in the harness's own repository, and it binds by PARAMETER
-- which is why this package can be installed next to anything.

**AND NOTHING HERE NOMINATES ITSELF FOR RETIREMENT.** A file may be kept, but not silently: if its own header says it
should go, the condition that retires it must be named. The one file that did is the observer's copy of the surface
fold, and the condition lives in the observer -- where the authority it waits for is. Here, the rule itself is the
package's, and a rule that has a home is not a candidate for deletion.

## The neighbours

This package is the measurement, and it is the half that can be used alone. The other halves live in their own
repositories, and each one is named here rather than inlined, because inlining a neighbour is how two copies of a
rule start drifting:

| repository | what it is |
|---|---|
| [dsh-system1-observer](https://github.com/johnlam1968/dsh-system1-observer) | the harness plugin: it binds this package to a live harness, by parameter, and it is where the harness's own words live |
| [dsh-session-index](https://github.com/johnlam1968/dsh-session-index) | the store: a SQLite index over the rows, with search and its own tools. It imports the rules from here |
| [pi-session-log](https://github.com/johnlam1968/pi-session-log) | the pi extension: the same rows, written from a pi transcript. It imports the rules from here |
| [dsh-session-rows](https://github.com/johnlam1968/dsh-session-rows) | **deprecated**, and a shim over `system1-measure/rules` -- kept because npm does not follow a rename, and a deleted package 404s an existing install |

## The subject: what gets measured

* `instrument/measure.js` -- **THE CHAIN, ONCE**: decide the segment size, judge each segment, judge a whole subject
  in one call, and combine the answers in code. A measurement is only comparable with a measurement, and the part
  that would be wrong to have twice is the judging, so the chain is here and nowhere else. No `ctx`, no schema, no
  render: those belong to whichever surface is asking
* `instrument/exchange.js` -- G0: the human's asks and the turn's last word, and the turn is the unit the harness
  numbers
* `instrument/turn-state.js` -- the state a judgement is made from, and what it keeps at both ends
* `instrument/segment.js` -- segmenting a subject that does not fit one request, and the arithmetic over the parts
* `subject.js` -- which model produced the text being judged

## The format: what a session log says

* `instrument/session-format.js` -- **THE VOCABULARY**: the record types a session log holds (`user/message`,
  `assistant/message`, `tool/call`, `tool/result`, `turn/start`, `turn/end`), the two message shapes, and the text
  extraction -- which reads the content where the RECORD TYPE says it is, never by searching for it. The whole `EVENT`
  catalogue lives here, and it is the one place in the package that names a record type: the harness's own event
  names are NOT here, because a host's events are a host's to name, and putting one in this catalogue would have put
  the harness's vocabulary inside the package that exists to have none of it
* `instrument/surface.js` -- **THE SURFACE FOLD**: what a session's events fold into, and which of them the model can
  still see. The rule it implements is the rule in `rules/index.js`, so the fold is stated once and a host's own
  fallback keeps working against this package's copy
* `instrument/normalize.js` -- **THE PRODUCER**: a dsh event log turned into rows, and the one place that knows what
  a dsh log is. Three things are DERIVED rather than projected -- the ask-group (never the log's own turn, which pi
  does not have), `shadowed` (what the surface withheld, from the `surfaceOp: replace` spans), and the receipt's
  sha256 and high-water. A pi transcript and a web export each need their own producer writing the same rows
* `session-rows.js` -- **THE NORMALIZED SESSION**, one shape for every harness: a receipt, messages, tool calls,
  facts. The unit is the ask-group (`exchange`), never a native `turn`, because pi has no turn at all and a
  per-turn query would silently become a dsh-only one while looking cross-harness. `shadowed` is required, a
  malformed line is counted rather than dropped, and absence is `null` rather than zero
* `instrument/tool-blocks.js` -- the `TOOL CALLS` section, and what was clipped out of it
* `rows-sqlite.js` -- **THE SAME ROWS, READ OUT OF AN INDEX**: finding a session and measuring it are different
  problems with different costs, and this answers "which sessions" where walking a directory of logs does not. Written
  against column NAMES, and it asks the index what it HAS rather than assuming -- an index built before `exchange`
  existed reads as rows with no ask-group, which the contract refuses, instead of raising `no such column` and taking
  the route down with it. A tool call gets its group derived from the last message at or before it, because the index
  stores none

## Composition: what the judge is given

* `questions.js` -- what is asked, in one place
* `question-sets.js` -- question sets as files: read them, hash them, list them
* `question-request.js` -- the ONE path from a question set to answers: which of the three routes carried the
  questions (a stored set by name, DSL strings, inline JSON), and how the answers read. They agreed by eye once and
  disagreed twice, which is the arrangement this module exists to end
* `question-lint.js` -- the authoring rules a machine can check: chiefly the rule that a question may only name
  state its scope actually emits, which the builder cannot see, because such a spec is perfectly well-formed and
  perfectly unanswerable
* `question-dsl.js` -- one question as ONE STRING (`key=value` fields separated by ` ;; `), which is the form
  that survives a tool-call argument: the nested arrays inside a JSON question spec do not, and four attempts to
  send one proved it. Its inverse is exact, because a format that cannot be written back cannot be edited
* `instrument-shape.js` -- **THE SHAPE, WITH NO HARNESS IN IT**: the pure half of the bridge, split out so a second
  host can build the same object without carrying a harness. The two host bindings -- which harness event a point
  attaches to, and which sessions are in scope -- are PASSED IN rather than imported, and the contract fixture pins
  what the shape must be
* `seams.js` -- the loop's vocabulary (nine points, what is true of each, the switch rule, the exit-code reader) and
  the probe's one question; it names no harness event, no payload shape and no config field
* `stream.js` -- the one seam that is not a decision, so it is the only one that needs its own shape
* `redact.js` -- redaction, and the rule that it applies to the trace's copy only

## The instrument: asking the decision model

* `observe.js` -- the call and the line: everything that can go wrong, covered
* `model/limits.js` -- what the backend will actually take, from the vendor's published numbers
* `model/wire.js` -- one POST, and every way it can go wrong turned into a result
* `model/client.js` -- the client of that wire
* `model/narrow.js` -- narrowing a reply to the answer type that was asked for
* `model/questions.js` -- building the questions the wire carries
* `model/envelope.js` -- one home for what crosses the transport boundary
* `model/result-envelope.js` -- where a transport puts its envelope
* `model/escalation.js` -- when a cheap model's answer is escalated

## The record: what was written down

* `evidence.js` -- the evidence record: what was observed, what was decided, and what is missing
* `trace-read.js` -- one reader for the trace, so the views of it cannot disagree
* `trace-report.js` -- `system1_trace`: the agent-facing trace reader
* `trace-data.js` -- the same trace in a shape a renderer can draw
* `turn-record.js` -- the `turn` trace line, and the acceptance check that proves it

## Judgements about the instrument itself

* `probe-score.js` -- does the question actually separate
* `calibrate.js` -- is the confidence worth anything
* `battery.js` -- the labelled battery: the only thing that can tell a better question from a different one
* `compare.js` -- are two runs the same experiment
* `cost.js` -- what the judgement cost, and what it is not
* `honesty.js` -- what this record claims about itself, and what nobody has checked
* `label-hash.js` -- a declared label, as a hash on the line
* `nudge-label.js` -- the independent label for `operator_had_to_nudge`

## Measurements made portable

* `report.js` -- the measurement report package: a measurement made portable, and what in it is reproducible

## The agent-facing tools

* `tool.js` -- the agent's way in
* `tool-args.js` -- checking a model's arguments against the tool's own declaration
* `questions-tool.js` -- `system1_question_sets`: list, read, validate and WRITE question sets -- the composing half
  of the instrument
* `battery-tool.js` -- `system1_battery`: run a labelled battery against a question set, and record the result
* `system1.js` -- THE ONE SURFACE: `composeQuestions` (compose and lint), `listQuestionSets` (list, in one shape
  every caller renders the same way) and `askQuestions` (load a set and call the model), plus `wireTransport` for a
  caller that has no row to inherit a transport from. Five surfaces once answered those three questions for
  themselves and disagreed; the facade is what stops a sixth

## The turn path

* `turn-trigger.js` -- the trigger's decision: whether to fire, and which question set

## Our own footprint

* `egress.js` -- what leaves the process, and where it goes
* `is-record.js` -- narrowing helpers for data that crosses a runtime boundary

## The rules, and the fixture that pins them

* `rules/index.js` -- **THE ROW CONTRACT**: the row kinds, the roles, the message types, the NUL rule, the source rule,
  the exchange grouping and the surface fold. It was `dsh-session-rows`, published and pinned, and it is absorbed here
  VERBATIM -- the same bytes, the same fixture, the same digest -- because the cheapest possible absorption is the one
  that changes nothing about it. The path `system1-measure/rules` is the one import path for these rules, and it is
  what `dsh-session-index` and `pi-session-log` import
* `rules/fixture/session.v4.jsonl` and `rules/fixture/rows.jsonl` -- the conformance fixture: one session, and the rows
  its producer must write. A fixture that is only checked against itself is decoration, so the digest is pinned here
  and in every repository that vendors a copy

## The contract, and the fixture a second host vendors

* `contract/index.js` -- **THE INPUT SHAPE'S CONTRACT**: the cases, the pinned digest, and the digest of a fixture
  held elsewhere. It is PUBLISHED, and that is the point: the shape is the thing two hosts build, and a fixture a
  second host cannot read pins nothing outside the repository that wrote it. So it ships, and it ships with its
  digest -- a fixture that travels without its digest protects nothing, because a renamed fixture is a different
  contract
* `contract/fixture/contract.mjs` -- the fixture itself: one case per shape, each with the config, the point, the
  transport and the EXACT expected object. It is a `.mjs` and not JSON because the shape distinguishes a key that is
  ABSENT from a key that is PRESENT AND HOLDS NOTHING, and JSON has no `undefined`

## The standalone

- `bin/ask.mjs` -- **THE STANDALONE**: measure a session with nothing installed. It is the entry point the boundary
  test copies into a clean room and RUNS, and it is why the package's zero-dependency claim is a measurement rather
  than a promise

## Gates and shared

* `scripts/check-contract-teeth.mjs` -- mutates the shape in a copy of the tree and fails if any mutation leaves the
  contract green. A contract is only as good as its witness
* `scripts/check-channel-agreement.mjs` -- the two channels of the same session must agree, where a second channel
  exists
