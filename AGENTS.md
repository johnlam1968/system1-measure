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

## The seams, and the guide that explains them

This package is built to be **bound to** something, and the bindings are the point. There are seven seams -- the two
bindings of the input shape, the cut, the transport, the question sets, the producer, the tools and the portable
package -- and **`docs/extending.md` is the list of them**, with the code, the contract each one obeys, and the
mistake it exists to prevent.

**A NEW SEAM IS ADDED THERE, AND NOWHERE ELSE.** A seam is a parameter or a directory, never an import: a host
passes it in, nothing in this package reaches for a host. The three properties a seam has, and the reasons:

* **It is a parameter.** A host passes it in. Nothing imports a host.
* **It is checked.** A missing or malformed seam is refused **by name**, before any work is done, with a sentence
  that says which one and why. A default is not a convenience here; a default scope is a false reading.
* **It is the only difference.** Two hosts that bind the same seams get the same measurement -- and that is a claim,
  and it is tested: `test/instrument-boundary.test.js` walks the tree, and `scripts/check-contract-teeth.mjs` mutates
  the shape and fails if the contract stays green.

**AND THE CONTRACT TRAVELS.** `system1-measure/contract` publishes the input shape's fixture and its digest, because
a contract a second host cannot read pins nothing outside the repository that wrote it. A fixture that travels
without its digest protects nothing: a renamed fixture is a different contract.

## What this package must never grow

* **A harness.** No `ctx`, no host event name, no `service` lookup, no `durableObject`. The two host bindings are
  passed IN as parameters, and the boundary test fails a module that reaches for anything else.
* **A runtime dependency.** `package.json` declares none, and the tarball gate checks the published manifest rather
  than the working tree. A measurement that needs something installed cannot be run in a clean room, and the clean
  room is the claim.
* **A second copy of the rules.** If a rule is needed elsewhere, it moves to `rules/index.js` — it is not restated
  where it is needed.
