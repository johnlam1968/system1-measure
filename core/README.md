# The map: `core/`, `instrument/` and `rules/`

The map of this package, grouped by what a reader is trying to do rather than by topic. **It is enforced**: a test
scans the three folders recursively and fails if a file is not named here, or if a name here does not exist -- so a new
file must be declared, exactly as a new host call must be declared in a harness plugin.

Two things this map deliberately does **not** carry, because something else already owns them:

* **which files touch a harness** — there are none, and that is measured rather than asserted:
  `test/instrument-boundary.test.js` walks every module's imports and fails a bare specifier that is not a node
  builtin.
* **line counts and percentages** — those move with every edit; a number here would be wrong within a week.

Paths are relative to their own folder: a module in `core/` is named bare (`questions.js`), a module in `instrument/`
carries its `instrument/` prefix (`instrument/measure.js`), and the rules carry theirs (`rules/index.js`) -- which is
the same name the code and the gates use.

**AND THE PACKAGE HAS NO HARNESS IN IT.** There is no `ctx` anywhere in this tree, no host event name, and no
dependency of any kind: `package.json` declares none, and the boundary test says so from the tree rather than from
this sentence. What binds a measurement to a harness lives in the harness's own repository, and it binds by PARAMETER
-- which is why this package can be installed next to anything.

## Nominated for retirement

A file may be kept, but not silently: if its own header says it should go, the condition that retires it lives here.
`test/growth.test.js` checks this both ways — a nominating file that is missing, or a row whose file no longer
nominates itself, fails. (Size budgets, the other half of that test, are machine facts and live beside it.)

| file | retired by | what says so |
|---|---|---|
| `dsh/session-adapter/lib/feed.js` | **MOVING to the session adapter (§14.6 (d)), not deleting**: its condition cannot be met where it is needed. Measured 2026-10-05 (`F104`) -- the authority is ASYNC and OPTIONAL, and the in-band path cannot await, so a deployment without `sessionQuery` would lose the answer entirely | its header: *"`readSession` for the log, `readSurface` for the surface; when the plugin is wired to that, these two modules are the ones to delete"* |
| `instrument/surface.js` | **WIRED, and NOT deleted, because deleting it is wrong** (`F104`): `sessionQuery.filterEvents(sessionId, [{kind:'surface', values:['current']}])` is now asked wherever a caller can await (`lib/surface-authority.js`), and this fold is the fallback for a deployment with no `sessionQuery` -- without which the shadowed-answer defect it was written for comes back. It MOVES to the session adapter with `feed.js`. **AND THE RULE ITSELF IS NOW THE PACKAGE'S** (2026-10-20): the file is a SEAM that re-exports `surfaceEvents` from `dsh-session-rows`, so the fallback relies on the package's fold and there is no second copy of the rule left to drift -- but that does not retire the file, because the HOST AUTHORITY still has to replace the fallback | its header: *"when the plugin is wired to it this fold is redundant and should be deleted"* |

## The subject: what gets measured


**THE SESSION-SHAPED THREE ARE NO LONGER IN `lib/host/`.** The harness's event vocabulary (`session-format`), the surface
fold (`surface`) and the event feed (`feed`) are the pure half of the session adapter and live in the package
[`instrument/`](dsh/session-adapter/), imported by name. The reason is measured (`F104`): they must be
**importable**, because the composer runs inside a synchronous path that cannot await a Cordis service. `fs-journal.js`
and this map stay, because the filesystem journal is not session-shaped.
  assistant messages, sliced by `kinds` and `lastMessages` exactly as `system1_evaluate_session` slices them,
  with `offset` to page backwards and `format: 'subject'` for the composed state. It was `lib/sessions-tool.js`
  (`system1_sessions`, four actions); `list`, `search` and `refresh` moved to the `dsh-session-index` plugin's
  `session_index_*` tools, which answer them from a SQLite store in milliseconds where `list` here took ~54 s,
  and the name changed so what remains says what it is. `lib/sessions-search.js` (the two-backend precedence
  policy, whose first backend this deployment leaves at `openAt: never`) and `lib/sessions-tool-output.js` (the
  schema and render for all four actions) went with them; the read's schema and render are in the tool now
  live. It is the ONE part of the old `session-subject.js` that read OUR config; the rest was the harness's shapes
  and is now `dsh/session-adapter/lib/reader.js`, with `surface-authority` beside it. Both take the `sessionQuery`
  service as a PARAMETER, so they still contain no host call for the inventory to find.
  as DSH session events, because the adapter reads HARNESS sessions and has no reader for any other format. Every
  rule in it was measured by the *Paper screening* session and is carried with its reasoning — the deepest-subtree
  branch rule, the pinned `source.kind: 'user'` title, the `step/start` pairing the harness enforces at read time,
  and the losses it refuses to fabricate (`F147`, `docs/adapters-and-standards.md`). The half that needs a harness
  is the writer, `scripts/import-deepseek-web.mjs`.
  names as the cheapest second adapter: 223 sessions on this host, a flat JSONL log, the same store layout. Three
  rules make it a conversion rather than a copy, each measured on the corpus rather than read off a spec: the live
  branch is pi's **leaf path** (not file order — a session can branch, and flattening two branches would merge two
  conversations), a **turn is derived from the operator ask** because *pi has no turn at all*, and an injected
  `custom_message` is a **message inside a turn, never an ask** — 183 of them on this host would otherwise have
  become 183 invented operator turns. The writer is `scripts/import-pi-sessions.mjs`, and it is **additive** where
  the DeepSeek one wipes its root, because it writes beside a live deployment's own sessions.

**THE STORE IS NO LONGER IN THIS REPOSITORY.** It is its own plugin and repo, [`dsh-session-index`](https://github.com/johnlam1968/dsh-session-index), which imports no dsh code: FTS5 search, listing, reading, and an incremental rebuild behind a `localSessionIndex` service, plus four agent-facing tools of its own. `lib/sessions-search.js` and the tool consume it through that package, and the map above no longer lists its files because they are not this plugin's files any more.
  sessions in a **SQLite** database (`~/.zeroclaw-jane/data/sessions/sessions.db`, a flat message list), where
  `dsh-chat-import`'s `openclaw` parser expects **JSONL** under `~/.openclaw/agents` — so despite zeroclaw being
  an OpenClaw variant, the shipped parser cannot read it, and the plugin's sqlite family does not list it either.
  Measured rather than assumed, and the supported way in is the plugin's own escape hatch: it produces the
  `interchange v1` document the `dsh-chat-import-convert` skill documents, and nothing else. The writer half that
  needs a harness is `scripts/zeroclaw-to-interchange.mjs`.
* `instrument/exchange.js` — G0: the human's asks and the turn's last word, and the turn is the unit the harness numbers
* `subject.js` — which model produced the text being judged

## The format: what a session log says

* `instrument/surface.js` — **THE SURFACE FOLD**: what a session's events fold into, and which of them the model can
  still see. It was `dsh/session-adapter/lib/surface.js` in the observer, and it is the format's half -- the rule it
  implements is the rule in `rules/index.js`, so the fold is stated once and the observer's fallback keeps working
  against the package's copy
* `instrument/session-format.js` — **THE VOCABULARY**: the record types a session log holds (`user/message`,
  `assistant/message`, `tool/call`, `tool/result`, `turn/start`, `turn/end`), the two message shapes, and the text
  extraction -- which reads the content where the RECORD TYPE says it is, never by searching for it. The whole `EVENT`
  catalogue moved here, and it is the one place in the package that names a record type: the harness's own event
  names are NOT here, because a host's events are a host's to name, and putting one in this catalogue would have put
  the harness's vocabulary inside the package that exists to have none of it

## Composition: what the judge is given

* `instrument/turn-state.js` — the state a judgement is made from, and what it keeps at both ends
* `instrument/segment.js` — segmenting a subject that does not fit one request, and the arithmetic over the parts
* `instrument/normalize.js` — **THE PRODUCER**: a dsh event log turned into those rows, and the one place that knows what a
  dsh log is. Three things are DERIVED rather than projected — the ask-group (never the log's own turn, which pi does
  not have), `shadowed` (what the surface withheld, from the `surfaceOp: replace` spans), and the receipt's sha256
  and high-water. A pi transcript and a web export each need their own producer writing the same rows
* `instrument/measure.js` — **THE CHAIN, ONCE**: decide the segment size, judge each segment, judge a whole subject in one
  call, and combine the answers in code. `system1_evaluate_session` delegates here and a standalone script will too,
  because a measurement is only comparable with a measurement and the part that would be wrong to have twice is the
  judging. No `ctx`, no schema, no render: those belong to whichever surface is asking
* `rows-sqlite.js` — **THE SAME ROWS, READ OUT OF AN INDEX**: finding a session and measuring it are different
  problems with different costs, and this answers "which sessions" where walking a directory of logs does not. Written
  against column NAMES, and it asks the index what it HAS rather than assuming — an index built before `exchange`
  existed reads as rows with no ask-group, which the contract refuses, instead of raising `no such column` and taking
  the route down with it. A tool call gets its group derived from the last message at or before it, because the index
  stores none
* `session-rows.js` — **THE NORMALIZED SESSION**, one shape for every harness: a receipt, messages, tool calls,
  facts. The unit is the ask-group (`exchange`), never a native `turn`, because pi has no turn at all and a
  per-turn query would silently become a dsh-only one while looking cross-harness (`F110`'s lesson, one level down).
  `shadowed` is required, a malformed line is counted rather than dropped, and absence is `null` rather than zero
* `instrument/tool-blocks.js` — the `TOOL CALLS` section, and what was clipped out of it
* `redact.js` — redaction, and the rule that it applies to the trace's copy only
* `stream.js` — the one seam that is not a decision

## The instrument: asking the decision model

* `questions.js` — what the observer asks, in one place
* `question-sets.js` — question sets as files: read them, hash them, list them
* `seams.js` — the loop's vocabulary (nine points, what is true of each, the switch rule, the exit-code reader) and
  the probe's one question; it names no harness event, no payload shape and no config field
* `observe.js` — the call and the line: everything that can go wrong, covered
* `model/limits.js` — what the backend will actually take, from the vendor's published numbers
* `model/wire.js` — one POST, and every way it can go wrong turned into a result
* `model/client.js` — the client of that wire
* `model/narrow.js` — narrowing a reply to the answer type that was asked for
* `model/questions.js` — building the questions the wire carries
* `model/envelope.js` — one home for what crosses the transport boundary
* `model/result-envelope.js` — where a transport puts its envelope
* `model/escalation.js` — when a cheap model's answer is escalated

## The record: what was written down

* `evidence.js` — the evidence record: what was observed, what was decided, and what is missing
* `trace-read.js` — one reader for the trace, so the views of it cannot disagree
* `trace-report.js` — `system1_trace`: the agent-facing trace reader
* `trace-data.js` — the same trace in a shape a renderer can draw
* `turn-record.js` — the `turn` trace line, and the acceptance check that proves it

## Judgements about the instrument itself

* `probe-score.js` — does the question actually separate
* `calibrate.js` — is the confidence worth anything
* `battery.js` — the labelled battery: the only thing that can tell a better question from a different one
* `compare.js` — are two runs the same experiment
* `cost.js` — what the judgement cost, and what it is not
* `honesty.js` — what this record claims about itself, and what nobody has checked
* `label-hash.js` — a declared label, as a hash on the line
* `nudge-label.js` — the independent label for `operator_had_to_nudge`

## Measurements made portable

* `report.js` — the measurement report package: a measurement made portable, and what in it is reproducible

## The agent-facing tools

* `tool.js` — the agent's way in
  parameter map is unwrapped, which is also what retires the raw-root `additionalProperties` deviation, plus the
  recorded fact that the OUTPUT (value) schema DSL has no `required`
* `tool-args.js` — checking a model's arguments against the tool's own declaration
* `questions-tool.js` — `system1_question_sets`
* `question-dsl.js` — one question as ONE STRING (`key=value` fields separated by ` ;; `), which is the form
  that survives a tool-call argument: the nested arrays inside a JSON question spec do not, and four attempts to
  send one proved it. Its inverse is exact, because a format that cannot be written back cannot be edited
* `system1.js` — THE ONE SURFACE: `composeQuestions` (compose and lint), `listQuestionSets` (list, in
  one shape every caller renders the same way) and `askQuestions` (load a set and call the model), plus
  `wireTransport` for a caller that has no row to inherit a transport from. Five surfaces once answered those three
  questions for themselves and disagreed; the facade is what stops a sixth
* `question-request.js` — the ONE path from a question set to answers, shared by `system1_decide` and `scripts/ask.mjs`:
  which of the three routes carried the questions (a stored set by name, DSL strings, inline JSON), and how the
  answers read. They agreed by eye once and disagreed twice, which is the arrangement this module exists to end
* `question-lint.js` — the authoring rules a machine can check, behind `system1_question_sets { action: 'lint' }`:
  chiefly the rule that a question may only name state its scope actually emits, which `buildQuestions` cannot see
  because such a spec is perfectly well-formed and perfectly unanswerable
* `battery-tool.js` — `system1_battery`

## The turn path: the harness seam

* `turn-trigger.js` — the trigger's decision: whether to fire, and which question set

## The host adapter


## Our own footprint

* `egress.js` — what leaves the process, and where it goes
  from the schema's own `volatile` metadata, so it cannot drift), the two mount-bound fields and why, what the row is
  set to right now, how to choose/write/validate a question set, and the cautions that make a reading trustworthy
  `publishConfig.tag` (measured on npm 11.8.0) and a bare `npm publish` would make the beta what `npm i` installs;
  `scripts/check-publish-tag.mjs` is the `prepublishOnly` wrapper, tested through its exit codes
  `subjects`, `axes`, `questions`, `limits`, `redaction`, `transport`). The only place a plain read of a setting is
  allowed besides `readConfigValue`, because it is where every `Volatile` is unwrapped before the instrument sees it
* `instrument-shape.js` — THE SHAPE, WITH NO HARNESS IN IT: the pure half of the bridge, split out so a second host can
  build the same object without carrying this harness (`ROADMAP.md` §14.8 step 1). The two host bindings -- which
  harness event a point attaches to, and which sessions are in scope -- are PASSED IN rather than imported, and the
  contract fixture (`test/fixtures/instrument-shape/contract.mjs`) pins what the shape must be. **THE BRIDGE IS THESE
  TWO FILES, and it is two files because the second one holds no harness:** both read the row's settings plainly, and
  `test/schema.test.js` names both as the legal routes
  of `seams.js` so the instrument names no harness event
  moved out of `seams.js` with its own measured notes on why `args[0]` was wrong at three of nine seams

## The rules, and the fixture that pins them

* `rules/index.js` — **THE ROW CONTRACT**: the row kinds, the roles, the message types, the NUL rule, the source rule,
  the exchange grouping and the surface fold. It was `dsh-session-rows`, published and pinned, and it is absorbed here
  VERBATIM -- the same bytes, the same fixture, the same digest -- because the cheapest possible absorption is the one
  that changes nothing about it. The path `system1-measure/rules` is the one import path for these rules, and it is
  what `dsh-session-index` and `pi-session-log` will import
* `rules/fixture/session.v4.jsonl` and `rules/fixture/rows.jsonl` — the conformance fixture: one session, and the rows
  its producer must write. A fixture that is only checked against itself is decoration, so the digest is pinned here
  and in every repository that vendors a copy

## The standalone

- `bin/ask.mjs` — **THE STANDALONE**: measure a session with nothing installed. It is the entry point the boundary
  test copies into a clean room and RUNS, and it is why the package's zero-dependency claim is a measurement rather
  than a promise

## Gates and shared

  describes the machine (a check's logic, like `citations.js`, not runtime code)
* `is-record.js` — narrowing helpers for data that crosses a runtime boundary


