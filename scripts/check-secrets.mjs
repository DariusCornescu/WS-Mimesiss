import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const patterns = [
  /(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}/g,
  /mongodb(?:\+srv)?:\/\/[^\s:/]+:[^\s@]+@/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /(?:ghp|github_pat)_[A-Za-z0-9_]{30,}/g,
]
let count = 0
for (const file of new Set(files)) {
  if (!/\.(?:[cm]?[jt]sx?|json|ya?ml|md|toml|env|txt|ps1)$/.test(file)) continue
  if (statSync(file).size > 2_000_000) continue
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  for (let line = 0; line < lines.length; line++) for (const pattern of patterns) {
    for (const match of lines[line].matchAll(pattern)) {
      if (/placeholder|fixture|example|your[_-]|<|\$\{/i.test(match[0])) continue
      console.error(file + ':' + (line + 1) + ' — possible secret (value redacted)'); count++
    }
  }
}
console.log(count ? count + ' possible secret(s) require review.' : 'No matching secret patterns in tracked/non-ignored text files.')
process.exitCode = count ? 1 : 0
