# Standing reminders

Read the doc.
Optionally, read the source code (if source code is not available, git clone it).

## What those two lines mean HERE

* **The doc** — `README.md` (the landing page: what the package is, what is in it, and the one path to the rules),
  `core/README.md` (**the map**: every file, what it is, which folder it belongs to), and `docs/`:
  `docs/session-log-format.md` (the format the rows and the vocabulary both speak),
  `docs/adapters-and-standards.md` (the session design and its measured costs),
  `docs/measurement-depth.md` (the evidence groups and scope),
  `docs/question-suitability.md`, `docs/state-suitability.md`, `docs/producer-consumer.md`.
* **The source** — this repository, and the two repositories that consume it:
  [`dsh-system1-observer`](https://github.com/johnlam1968/dsh-system1-observer) (the plugin that binds a
  measurement to one harness), [`dsh-session-index`](https://github.com/johnlam1968/dsh-session-index) (the store)
  and [`pi-session-log`](https://github.com/johnlam1968/pi-session-log) (the pi extension) — all three of which
  import the rules from `system1-measure/rules`.
* **Why** — a measurement says what happened; a type says what can. The three repositories that consume the rules
  are the proof that the rules are stated once: they vendor the fixture, they pin its digest, and a change to it
  lands in a CONSUMER's test rather than here.

## The four rules this package holds itself to

1. **MEASURE, DO NOT DECLARE.** A number is what a script printed, not what a comment claims. `test/instrument-boundary.test.js`
   reads the tree and reports what it finds; the sentences above it are commentary, not the check.
2. **ONE RULE, ONE PATH.** The rules live in `rules/index.js` and are imported as `system1-measure/rules`. They are
   not re-exported from the package's main entry, and the row reader imports them rather than restating them — a
   rule stated twice is a rule that will be changed once.
3. **THE GATES ARE THE CLAIMS.** `npm run ci` is: the suite, the coverage floor, and the contract teeth. A claim
   that is not checked by a gate is a sentence.
4. **THE FIXTURE IS THE CONTRACT.** `rules/fixture/` and `test/fixtures/` are digest-pinned. Changing the fixture
   changes the digest, and every vendored copy has to be updated deliberately, by a person who read why.

## What this package must never grow

* **A harness.** No `ctx`, no host event name, no `service` lookup, no `durableObject`. The two host bindings are
  passed IN as parameters, and the boundary test fails a module that reaches for anything else.
* **A runtime dependency.** `package.json` declares none, and the tarball gate checks the published manifest rather
  than the working tree. A measurement that needs something installed cannot be run in a clean room, and the clean
  room is the claim.
* **A second copy of the rules.** If a rule is needed elsewhere, it moves to `rules/index.js` — it is not restated
  where it is needed.
