import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
const require = createRequire(import.meta.url)
const ts = require('typescript')
export function load(path, dependencies = {}) {
  const source = ts.transpileModule(readFileSync(new URL('../../' + path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  const loadedModule = { exports: {} }
  runInNewContext(source, { module: loadedModule, exports: loadedModule.exports, require: name => {
    if (!(name in dependencies)) throw new Error('Unexpected dependency: ' + name)
    return dependencies[name]
  }, URL, Buffer, Date, Response, Request, Uint8Array, process, setTimeout, console: { error() {} } })
  return loadedModule.exports
}
