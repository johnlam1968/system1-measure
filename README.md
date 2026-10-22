# system1-measure

**A measurement you can run by yourself.** Ask a model questions about a session, get back a reading you can keep,
compare and share — with no harness, no plugin, no service, and **no dependency of any kind**.

```bash
npm install system1-measure
npx system1-ask --list
```

That is the whole installation. There is nothing else to configure, nothing to mount, and no second package to find:
`system1-measure` declares **no runtime dependencies at all**, and that is checked rather than claimed — the publish
gate reads the *published* manifest, and `test/instrument-boundary.test.js` fails any module that imports anything
but node builtins and itself.

---

## The first minute

The package ships **16 question sets** and a standalone that reads a session. This is the whole thing, offline, with
no model key and no harness:

```bash
cat > /tmp/demo-session.jsonl <<'EOF'
{"kind":"receipt","harness":"demo","id":"s1","source":"/logs/demo.jsonl","sourceBytes":120,"sourceSha256":"ab8b1f2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8","highWater":2,"schemaVersion":1}
{"kind":"message","seq":1,"exchange":0,"ordinal":0,"role":"user","type":"text","text":"why is the build red?","reasoning":null,"shadowed":false,"interrupted":false}
{"kind":"message","seq":2,"exchange":0,"ordinal":1,"role":"assistant","type":"text","text":"the lockfile names a version that is not published","reasoning":null,"shadowed":false,"interrupted":false}
EOF

npx system1-ask session --file /tmp/demo-session.jsonl --describe
```

```
demo session s1  sha256 ab8b1f2c3d4e
2 message(s), 0 tool call(s), 1 exchange(s)
0 reasoning char(s); 0 shadowed, 0 char(s) withdrawn by compaction
  exchange 0: 1 ask(s), 1 answer(s), 0 shadowed
```

A normalized session is **rows**: a receipt, then messages, tool calls and facts. One JSON object per line. The
receipt comes first because a measurement that cannot name the bytes it read cannot be reproduced or argued with.
The contract for those rows is [`system1-measure/rules`](#the-rules-and-the-one-path-to-them).

To actually **ask** something, the standalone needs a model, and it needs a key:

```bash
export OPENROUTER_API_KEY=...          # read from the environment BY NAME, never as an argument
npx system1-ask --set news-claim-check@2 --scope admit --state "the sky is blue because the ocean reflects it"
```

The key is read from the environment **by name** and never taken as an argument — a key on a command line is a key
in the shell history, in the process table, and in every `ps` on the host. It is the only place a credential enters
this package, which is what makes *"the measurement holds no secret"* checkable rather than aspirational.

Two more routes spend nothing and need no key:

```bash
npx system1-ask --list                                  # the 16 sets this package ships, with their hashes
npx system1-ask --set news-claim-check@2 --lint          # check a set against the authoring rules, ask nothing
```

## What it does

The measurement asks a model **questions about a session** and records what it said. Three questions, one place:

| operation | what it is |
|---|---|
| **compose** | build the questions, from DSL strings, inline JSON, or a stored set — and lint them |
| **list** | what sets exist, in one shape every caller renders the same way |
| **ask** | load a set (or an inline list) and call the model with it |

Everything else is a difference of **subject** (a session, a seam's state, a pasted article), **transport** (a
closure, or a URL and a key) and **trace** (some surfaces record, some do not). Those are the three legitimate
differences between callers, and a caller wanting a fourth difference should add it in one place, not five.

A measurement is **portable**: `npx system1-ask ... --package` writes a directory with a manifest, a report, the
readings, the trace and a hash of the reproducible files — so two measurements can be compared, and one can be
argued with.

## It is built to be bound to

This package holds **no harness** and knows what one is not. That is not a limitation — it is the design, and it is
what makes it reusable. Everything a host has to supply is a **seam**, and every seam is a parameter, never an
import.

| seam | what a host supplies | where |
|---|---|---|
| **the two bindings** | `describePoint(seam, enabled) -> {id, hostEvent, enabled}` and `observed(config, agentId) -> boolean` | `instrumentShape()` |
| **the cut** | how a subject is divided when it does not fit one request: `(events, messages, opts) -> parts[]` | `judgeSegments({ cut })` |
| **the transport** | `{ decide(request) -> result }` — a closure, not a model | `askQuestions(input, transport)` |
| **the question sets** | a directory of `.json` files, one per set, one scope per file | `criteria/` |
| **the producer** | how *your* substrate's records become rows | `normalizeEvents()` is one such producer |
| **the tools** | `system1_battery` and `system1_question_sets` — two agent-facing tools that measure the instrument itself | `core/*-tool.js` |

**The two bindings are the whole of the harness-specific part.** A second host — a pi extension, an agent session
runner, anything — builds the *same* input object and gets the *same* measurement:

```js
import { instrumentShape } from 'system1-measure'

const shape = instrumentShape(config, {
    point: 'draft',
    describePoint: (seam, enabled) => ({ id: seam, hostEvent: 'my_host/turn', enabled }),
    observed: (config, agentId) => mySessions.has(agentId),
})
```

A missing binding is **refused by name, before anything is built** — a shape built against a default predicate would
answer *"every session is in scope"* for a host that meant to scope it, and a measurement that observes a
conversation nobody scoped is not a measurement anybody can trust.

And that is not a promise: the shape has a **contract fixture**, digest-pinned, and a script that mutates the shape
in a copy of the tree and fails if any mutation leaves the contract green. **15 mutations, 15 caught.** A second host
that builds the same shape can vendor the same fixture and prove it.

**→ [`docs/extending.md`](docs/extending.md) is the guide: every seam, with the code.**

## The rules, and the one path to them

`system1-measure/rules` is where the row contract lives — the row kinds, the roles, the message types, the NUL rule,
the source rule, the exchange grouping, the surface fold, and the conformance fixture with its digest.

The rules are not re-exported from the package's main entry, on purpose. **A rule stated in two places is a rule that
will be changed in one of them**, and the other repository that depends on it will not be told. They were
`dsh-session-rows`, published and digest-pinned, and they are absorbed here **verbatim** — the same bytes, the same
fixture, the same digest `27bb1c0c893adb4f6b52648fdff32cb17b39022f8dbea53451ac5f84058cdb66`.

```js
import { withoutNuls, visibleText, isHumanMessage, fixtureDigest } from 'system1-measure/rules'
```

## The API

```js
import {
    // the three operations
    composeQuestions, listQuestionSets, askQuestions, wireTransport,
    // the input shape, and the two bindings
    instrumentShape,
    // the chain
    judgeSegments, judgeOnce, measurementSummary, segmentBudgetFor,
    // the producer, and the reader
    normalizeEvents, readRowsJsonl, validateRows, rowsSummary, exchangesOfRows, segmentsOfRows,
    // the portable measurement
    buildPackage, buildSkeleton, writePackage, packageId,
} from 'system1-measure'
```

The two halves are separable and both are public: `"./core/*"` and `"./instrument/*"` are open subpaths, so a
consumer that needs only the format's vocabulary does not have to take the measurement with it.

## The map

**[`core/README.md`](core/README.md)** is the map of this package — every file, what it is, and which folder it
belongs to. It is enforced by a test: a file that is not named there fails, and a name that is not there fails.

## The documents

| document | what it is |
|---|---|
| [`docs/extending.md`](docs/extending.md) | **every seam, with the code** — how to bind this to your agent session or harness |
| [`docs/session-log-format.md`](docs/session-log-format.md) | the format the rows and the vocabulary both speak |
| [`docs/producer-consumer.md`](docs/producer-consumer.md) | the producer/consumer shape, and why the producer is a seam |
| [`docs/measurement-depth.md`](docs/measurement-depth.md) | the evidence groups, and what G0–G4 mean |
| [`docs/question-suitability.md`](docs/question-suitability.md) | which question may be asked of which evidence |
| [`docs/state-suitability.md`](docs/state-suitability.md) | which state may be given to the judge, and how it must be written |
| [`docs/adapters-and-standards.md`](docs/adapters-and-standards.md) | the session/database design, and what the rest of the industry actually stands |

## Licence

MIT.
