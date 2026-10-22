#!/usr/bin/env node
// THE CLI HALF OF THE NODE FLOOR GATE.
//
// The judgement lives in `core/node-floor.js`, so the gate itself can be tested -- a gate nothing tests is a gate
// that rots. This script reads the manifest, asks the judgement, and says what it found.
//
// IT RUNS FIRST, before anything that would fail cryptically. On node 22.12.0 the suite dies with "No such
// built-in module: node:sqlite", which points at the code instead of at the runtime; this points at the runtime.
//
// EXIT: 0 when the runtime is inside the declared range, 1 when it is not, or when the range cannot be checked.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkNodeFloor, readManifest } from '../core/node-floor.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = readManifest(root)
const { ok, problems, notes } = checkNodeFloor(manifest, { node: process.versions.node })

for (const note of notes) console.log(`node-floor: ${note}`)
if (ok) {
    console.log(`node-floor: node ${process.versions.node} satisfies engines.node ${manifest.engines.node}`)
    process.exit(0)
}
for (const problem of problems) console.error(`node-floor: ${problem}`)
console.error(`node-floor: this package needs node ${manifest.engines.node}.`)
console.error('node-floor: on node 22.12 and older `node:sqlite` still needs the --experimental-sqlite flag, and a')
console.error('node-floor: script cannot turn that on for the tests that follow it.')
console.error('node-floor: install a supported node -- `nvm install 22` -- and re-run.')
process.exit(1)
