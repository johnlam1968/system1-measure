// THE STANDALONE RESOLVES QUESTIONS THROUGH THE FACADE, AND SAYS SO.
//
// The other half of the observer's claim: this repository's `core/decide-tool.js` resolves questions through the
// SAME module this script does -- `core/system1.js` -- and each side proves its own half, because a test that
// spanned two repositories would be a test neither of them could move.
//
// THE TEST THAT PREVENTS THE DRIFT, rather than describing it after the fact. The tool and the script used to be two
// callers of one facade, they agreed by eye once and disagreed twice -- the tool took `questions` while the script
// took a set, and the DSL reached only one of them.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const script = readFileSync(join(ROOT, 'bin', 'ask.mjs'), 'utf8')

test('the standalone resolves questions through the facade, and says so', () => {
  assert.match(script, /from '\.\.\/core\/system1\.js'/, 'the script must go through the facade')
  // AND IT MAY NOT HAVE QUESTION CODE OF ITS OWN. The script's header names these modules to explain WHY it needs no
  // dependency, and a substring test over the whole file would read that explanation as a violation of it.
  const scriptCode = script.split('\n').filter((line) => !line.trimStart().startsWith('//')).join('\n')
  assert.equal(/question-lint|question-dsl|question-sets|question-request/.test(scriptCode), false, 'the standalone has no question code of its own')
  // AND IT MAY NOT GO TO THE MODEL ITS OWN WAY. The standalone used to build its client from `core/model/client.js`
  // directly; it now asks the facade for one, so the credential and the endpoint are decided in the same place for
  // every surface -- which is the thing a second call site would quietly get wrong.
  assert.match(script, /wireTransport/, 'the standalone gets its transport from the facade too')
})
