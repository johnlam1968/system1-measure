# system1-measure

> Measure an agent session — the questions asked, the answers given, and the evidence behind them.

**What it is.** A measurement you can run on an agent session, and keep. You hand it the session; it asks the
questions you chose, writes down every answer beside the evidence it came from, and leaves you a portable record.

**It has no harness in it, and no dependencies.** Nothing in the package reaches for a host, a model or a network
service on its own. What a host supplies — where its sessions come from, how it reaches a model — is passed in as a
parameter, so the same measurement runs under any harness, or under none. MIT licensed.

## Install

```bash
npm install system1-measure
```

That is the whole installation. The package declares **no runtime dependency at all**, and runs on Node 22.19 or newer.

## The first minute

A session is a file of rows — a receipt, then messages, tool calls and facts — one JSON object per line. Here is a
complete one:

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

No model, no key, no network: that describes a session and prints what is in it. `npx system1-ask --list` prints the
**16 question sets** that ship with the package, and `--set news-claim-check@2 --lint` checks a set without asking
anything.

## Asking it questions

`askQuestions` takes the questions and a **transport** — a function you write that actually calls a model:

```js
import { askQuestions, wireTransport } from 'system1-measure'

const transport = wireTransport({ baseUrl: 'https://openrouter.ai/api', model: 'jev-latest', keyEnv: 'OPENROUTER_API_KEY' })
const answer = await askQuestions({ set: 'news-claim-check@2', scope: 'admit' }, transport)
```

The key is read from the environment **by name**, never as an argument, so it never reaches a command line or a
process list. If you would rather ask your own model, write your own transport: it is one function, `decide(request)`.

## Putting it on your own agent session

A host supplies **two functions**, and the rest is the package's:

* **`describePoint(point, enabled)`** — which of your events a measurement point attaches to, and whether that point is
  switched on.
* **`observed(config, agentId)`** — whether this session is in scope.

Give it those and it builds what it needs; leave one out and it says which one, by name, before it does any work.

## What you get

* **16 question sets** you can run, read, edit and lint. The questions are an artifact, not a constant.
* **A portable measurement**: a directory with the report, the readings, the trace, and a hash of the reproducible files.
* **A published contract** for the input, so a second host can prove it builds the same thing.
* **Two tools for an agent** — one for the question sets, one for the labelled battery that tells a better question from
  a different one.

## Before you trust a reading

* "I cannot tell" is an answer. A set that cannot express it will report a false certainty.
* The text is what the model could see, not what the session wrote: a span withdrawn by compaction is marked as
  withdrawn, and it stays in the count.
* A measurement names the bytes it read. A reading you cannot point at is a reading you cannot argue with.

## Questions, and contributing

Ask in [GitHub issues](https://github.com/johnlam1968/system1-measure/issues); pull requests are welcome. The long
documentation is off this page on purpose — start with
[the guide to putting it on your own session](https://github.com/johnlam1968/system1-measure/blob/master/docs/extending.md),
then [the map of every file](https://github.com/johnlam1968/system1-measure/blob/master/core/README.md), then
[the format a session log has to speak](https://github.com/johnlam1968/system1-measure/blob/master/docs/session-log-format.md).

## Licence

MIT.
