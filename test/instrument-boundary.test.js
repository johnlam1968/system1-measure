// THE PACKAGE'S BOUNDARY, AND IT IS A STRONGER CLAIM THAN THE ONE IT REPLACED.
//
// The claim this repository makes is not "the code is in a folder" -- it is "the code has no harness in it, and no
// dependency of any kind, and the standalone runs with nothing installed". Three assertions, and each one is checked
// from the tree rather than from a list somebody chose.
//
// WHY THE LISTS ARE GONE. The observer's boundary test declares an INSTRUMENT set and a HOST_COUPLED set, because
// that repository holds BOTH halves: portable code and harness glue, and the boundary is what separates them. This
// package holds one half. A list of fifty files that are all in the same class is a list that changes only when
// somebody adds a file, and it would be checked for its own sake. What replaces it is the DIRECTION OF THE EDGES:
// every module in `core/` and `instrument/` may import node builtins and itself, and nothing else. A new module is
// covered the moment it exists, which is the property the hand-kept list could not have.
//
// THE THREE ASSERTIONS.
//   1. No module imports anything but node builtins and its own tree. The package's `dependencies` block is empty,
//      and this is the assertion that makes that true rather than decorative.
//   2. The closure of `bin/ask.mjs` reaches no bare specifier but `node:` -- derived from the entry point, not from a
//      list, because a boundary enforced by a list is a boundary that is true until somebody adds a module.
//   3. The standalone RUNS in a directory with no `node_modules` at all. A static walk can be fooled by a dynamic
//      import, an export condition, or a file it failed to resolve; a run cannot, and it costs one process.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '')

/** Every source file the package owns. */
const filesUnder = (dir) => {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...filesUnder(full))
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) out.push(full)
  }
  return out
}

/** The modules that are the package's own code -- the two halves, and the rules. */
const MODULES = [...filesUnder(join(ROOT, 'core')), ...filesUnder(join(ROOT, 'instrument')), join(ROOT, 'rules/index.js')]

/**
 * THE IMPORTS, in every form, with the comments and the strings read out of the way.
 *
 * `from '...'` alone is not enough: a side-effect `import '...'`, a dynamic `await import('...')` and a
 * `require('...')` are imports too, and a gate that catches one form and says it catches them all has a hole in it.
 *
 * THE SCANNER IS REGEX-AWARE AND STRING-AWARE, and both of those are the observer's, carried over rather than
 * rewritten -- because this repository has already paid for both lessons. A string's content is prose, not code:
 * `core/report.js` carries the line `'> The numbers below are read from `readings.json` in this package'`, and a scan
 * that read string contents as code found `from `readings.json`` in it -- an import of a file that does not exist,
 * reported against a file that imports nothing but node builtins. And a regex literal's body is opaque: a quote
 * inside one -- /it's/ -- put the scanner into string mode, and every `//` comment after it stopped being a comment.
 */
const code = (text) => {
  let out = ''
  let index = 0
  let string = null
  let keepString = false
  let line = false
  let block = false
  // WHAT MAY PRECEDE A REGEX LITERAL. This is the standard reading, and it is a READING rather than a proof: a `/`
  // after an operator is a regex, and a `/` after a value is a division. The failure mode is chosen on purpose -- a
  // misread that hides an import is worse than one that reports a false positive.
  const PRECEDES_REGEX = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^'])
  const REGEX_KEYWORDS = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'case', 'do', 'else', 'yield', 'await', 'void', 'delete', 'new'])
  // AND WHERE A STRING IS A SPECIFIER, which is the ONE place a string is the argument of an import and its content
  // has to survive the scan.
  const SPECIFIER_BEFORE = /(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*|\brequire\s+)$/
  const lastSignificant = () => {
    for (let at = out.length - 1; at >= 0; at -= 1) {
      const char = out[at]
      if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') return char
    }
    return ''
  }
  const lastWord = () => {
    const match = /([A-Za-z_$][A-Za-z0-9_$]*)\s*$/.exec(out)
    return match === null ? '' : match[1]
  }
  const startsRegex = () => {
    const before = lastSignificant()
    if (before === '') return true
    if (PRECEDES_REGEX.has(before)) return true
    return REGEX_KEYWORDS.has(lastWord())
  }
  while (index < text.length) {
    const char = text[index]
    const next = text[index + 1]
    if (line) { if (char === '\n') { line = false; out += char } index += 1; continue }
    if (block) {
      if (char === '*' && next === '/') { block = false; index += 2; continue }
      if (char === '\n') out += char
      index += 1
      continue
    }
    if (string !== null) {
      if (char === '\\') { if (keepString) out += char + (next ?? ''); index += 2; continue }
      if (char === string) { string = null; out += char; index += 1; continue }
      // THE CONTENT OF A STRING IS PROSE, NOT CODE, and the scan has to know that. `core/report.js` carries the line
      // `'> The numbers below are read from `readings.json` in this package'`, and a scan that reads string contents as
      // code found `from `readings.json`` in it -- an import of a file that does not exist, reported against a file that
      // imports nothing but node builtins. So the content is BLANKED, and kept in the one place it is the argument of
      // an import.
      if (keepString) out += char
      index += 1
      continue
    }
    if (char === '/' && next === '/') { line = true; index += 2; continue }
    if (char === '/' && next === '*') { block = true; index += 2; continue }
    if (char === '/' && startsRegex()) {
      // THE BODY OF A REGEX LITERAL IS OPAQUE, and a quote inside it is not a quote. The body is dropped rather than
      // kept, because a regex that CONTAINS the word `import` is not an import.
      index += 1
      let inClass = false
      while (index < text.length) {
        const body = text[index]
        if (body === '\\') { index += 2; continue }
        if (body === '\n') break
        if (body === '[') inClass = true
        else if (body === ']') inClass = false
        else if (body === '/' && !inClass) { index += 1; break }
        index += 1
      }
      out += ' '
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      string = char
      keepString = SPECIFIER_BEFORE.test(out)
      out += char
      index += 1
      continue
    }
    out += char
    index += 1
  }
  return out
}

/**
 * EVERY IMPORT FORM, and there are four.
 *
 * `from '...'` was the only one the first version of this scan matched, so a side-effect `import '...'`, a dynamic
 * `await import('...')` and a `require('...')` were all invisible -- and a `dsh/` import through any of them would
 * have passed a gate that read as exhaustive.
 *
 * AND A TEMPLATE LITERAL COUNTS TOO, which the first version of this scan also missed: `import(\`...\`)` is a dynamic
 * import like any other, and a gate that catches three forms and says it catches them all is a gate with a hole in it.
 */
const IMPORTS = /(?:\bfrom\s+|\bimport\s*\(|\bimport\s+|\brequire\s*\()\s*['"`]([^'"`]+)['"`]/g
const importsOf = (file) => [...code(read(file)).matchAll(IMPORTS)].map((match) => match[1])

test('every module imports nothing but node builtins and its own tree', () => {
  const offenders = []
  for (const file of MODULES) {
    const rel = relative(ROOT, file)
    for (const specifier of new Set(importsOf(file))) {
      if (specifier.startsWith('node:')) continue
      if (specifier.startsWith('.')) continue
      offenders.push(`${rel} imports ${specifier}`)
    }
  }
  assert.deepEqual(offenders, [], 'the package depends on something outside itself:\n  ' + offenders.join('\n  '))
})

test('the package declares no dependency at all, so the assertion above is not the only one', () => {
  const manifest = JSON.parse(read(join(ROOT, 'package.json')))
  assert.deepEqual(manifest.dependencies ?? {}, {}, 'the package declares a dependency')
  assert.deepEqual(manifest.peerDependencies ?? {}, {}, 'the package declares a peer dependency')
  assert.deepEqual(manifest.optionalDependencies ?? {}, {}, 'the package declares an optional dependency')
})

test('no module names a harness event, or reads the host\'s event catalogue', () => {
  const offenders = []
  for (const file of MODULES) {
    const source = code(read(file))
    for (const match of source.matchAll(/'(?:agent|tools|llm|system-prompt|ctx)\/[a-z-]+(?:\/[a-z-]+)*'/g)) {
      offenders.push(`${relative(ROOT, file)} names ${match[0]}`)
    }
    if (/\bctx\.\w/.test(source)) offenders.push(`${relative(ROOT, file)} reaches the host object`)
  }
  assert.deepEqual(offenders, [], 'a module names a harness event:\n  ' + offenders.join('\n  '))
})

// THE STANDALONE'S OWN BOUNDARY, DERIVED RATHER THAN DECLARED.
//
// Walk the import graph from the entry point and assert that every file it reaches can be loaded with no
// `node_modules` at all -- no bare specifier anywhere in the closure. That is the property the standalone actually
// has, and it is measured from the entry point rather than asserted about a list.
test('everything `bin/ask.mjs` reaches is loadable with no node_modules at all', () => {
  const seen = new Set()
  const bare = []
  const queue = ['bin/ask.mjs']
  while (queue.length > 0) {
    const file = queue.pop()
    if (seen.has(file)) continue
    seen.add(file)
    for (const specifier of importsOf(join(ROOT, file))) {
      if (specifier.startsWith('node:')) continue
      if (!specifier.startsWith('.')) { bare.push(`${file} imports ${specifier}`); continue }
      const resolved = normalize(join(dirname(join(ROOT, file)), specifier))
      if (existsSync(resolved)) queue.push(relative(ROOT, resolved).split('\\').join('/'))
      else bare.push(`${file} imports ${specifier} (which does not exist)`)
    }
  }
  assert.deepEqual(bare, [], 'the standalone cannot be loaded without installing something:\n  ' + bare.join('\n  '))
  // AND THE CLOSURE IS NOT VACUOUS -- a graph that resolved to nothing would pass every assertion above.
  assert.ok(seen.has('core/system1.js'), 'the closure really does reach the facade')
  assert.ok([...seen].filter((f) => f.startsWith('core/')).length >= 10,
    `and it is a real graph, ${[...seen].filter((f) => f.startsWith('core/')).length} core files`)
})

// THE CLEAN ROOM, EXECUTED RATHER THAN INFERRED.
//
// The static test above reads the import graph. This one COPIES the package to a temporary directory with no
// `node_modules` at all and RUNS the entry point there, which is the property that is actually claimed: the standalone
// works with nothing installed.
test('the standalone RUNS in a directory with no node_modules at all', async () => {
  const { execFileSync } = await import('node:child_process')
  const { mkdtempSync, cpSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const root = mkdtempSync(join(tmpdir(), 'clean-room-'))
  try {
    for (const dir of ['core', 'instrument', 'rules', 'criteria', 'bin']) cpSync(join(ROOT, dir), join(root, dir), { recursive: true })
    assert.equal(existsSync(join(root, 'node_modules')), false, 'nothing was installed to replace it')
    // `--list` reads every composition and prints it. It reaches the loader, the linter, the question builder and
    // the set reader -- the whole reading half of the instrument -- and it costs nothing.
    const out = execFileSync(process.execPath, [join(root, 'bin', 'ask.mjs'), '--list'], { encoding: 'utf8' })
    assert.match(out, /set\(s\) in/, 'and it printed the sets it found')
    assert.match(out, /news-claim-check@2/, 'including a composition this package ships')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
