# The documents

**Start with [`extending.md`](extending.md)** if you are here to bind this package to something. It is the list of
the seven seams, with the code, the contract each one obeys, and the mistake it exists to prevent.

| document | what it is | for |
|---|---|---|
| [`extending.md`](extending.md) | **the seams** — the two bindings, the cut, the transport, the question sets, the producer, the tools, the portable package, and the contract a second host can prove | binding it to an agent session or a harness |
| [`session-log-format.md`](session-log-format.md) | the format the rows and the vocabulary both speak: a receipt, then messages, tool calls and facts | writing a producer, or reading a session |
| [`producer-consumer.md`](producer-consumer.md) | the producer/consumer shape, and why the producer is a seam rather than a library | writing a producer |
| [`measurement-depth.md`](measurement-depth.md) | the evidence groups, and what G0–G4 mean | choosing a scope, and reading a reading |
| [`question-suitability.md`](question-suitability.md) | which question may be asked of which evidence | writing a question set |
| [`state-suitability.md`](state-suitability.md) | which state may be given to the judge, and how it must be written | composing a subject |
| [`adapters-and-standards.md`](adapters-and-standards.md) | the session/database design, and what the rest of the industry actually stands | deciding what to build and what to borrow |

**And two maps**, in the code rather than here:

- **`core/README.md`** — every file in this package, what it is, and which folder it belongs to. It is enforced by a
  test: a file that is not named there fails, and a name that is not there fails.
- **`../AGENTS.md`** — the four rules this package holds itself to, and the three things it must never grow.

## Reading order, if you are new

1. **`../README.md`** — what it is, and the first minute (a session described, with nothing installed).
2. **`extending.md` §1** — the two bindings. That is the whole of the harness-specific part.
3. **`extending.md` §5** — the producer, if your records are not already rows.
4. **`session-log-format.md`** — the shape of what a producer must write.
