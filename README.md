# system1-measure

**The measurement.** The question sets, the composition, the chain that judges a subject in parts, the session-log
format, the producer that normalizes a log into rows, the reader that checks those rows, and the rules they all
obey.

**No harness. No dependencies.** There is no `ctx` in this tree, no host event name, and no runtime dependency of any
kind — `package.json` declares none, and `test/instrument-boundary.test.js` proves it from the tree rather than from
this sentence. The standalone runs in a directory with nothing installed, and the test that says so copies the
package into a clean room and *runs* it.

```bash
npm install system1-measure
npx system1-ask --list          # the question sets this package ships
npx system1-ask --help          # the five routes
```

## What is in here

| path | what it is |
|---|---|
| `core/` | the instrument: the question sets, the composition, the model call path, the record, the report |
| `instrument/` | the format's half: the vocabulary, the producer, the chain, the surface fold |
| `rules/` | the row contract, and the conformance fixture that pins it — published as `system1-measure/rules` |
| `criteria/` | the question sets this package ships, one directory per set |
| `bin/ask.mjs` | the standalone: measure a session with nothing installed |

The two halves are separable and both are public: `"./core/*"` and `"./instrument/*"` are open subpaths, so a consumer
that needs only the format's vocabulary does not have to take the measurement with it.

## The rules, and the one path to them

`system1-measure/rules` is where the row contract lives — the row kinds, the roles, the message types, the NUL rule,
the source rule, the exchange grouping, the surface fold, and the fixture with its digest.

The rules are not re-exported from the package's main entry on purpose. **A rule stated in two places is a rule that
will be changed in one of them**, and the other repository that depends on it will not be told. The rules were
`dsh-session-rows`, published and digest-pinned, and they are absorbed here **verbatim** — the same bytes, the same
fixture, the same digest `27bb1c0c893adb4f6b52648fdff32cb17b39022f8dbea53451ac5f84058cdb66` — so every vendored copy
in the other repositories is still the same bytes.

## The shape, and its contract

The input shape is what two hosts build: this package's shape, and one day a second host's builder. It is a plain
object — `point`, `callsEnabled`, `subjects`, `axes`, `questions`, `limits`, `redaction`, `transport` — and the two
host-specific parts are **passed in**, not imported: which harness event a point attaches to, and which sessions are in
scope. That is what makes a second host possible without a second copy.

The contract is a fixture, digest-pinned, and the fixture has teeth: `scripts/check-contract-teeth.mjs` mutates the
shape in a copy of the tree and fails if any mutation leaves the contract green. **15 mutations, 15 caught.**

## What this package is not

It is not a harness plugin. It does not know what a harness is, it does not subscribe to anything, and it does not
decide anything about a deployment. The plugin that binds a measurement to one harness is
[`dsh-system1-observer`](https://github.com/johnlam1968/dsh-system1-observer), and it depends on this package.

## The map

`core/README.md` is the map of this package — every file, what it is, and which folder it belongs to. It is enforced
by a test: a file that is not named there fails, and a name that is not there fails.

## Licence

MIT.
