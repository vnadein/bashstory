import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

console.log('[v0] Installing sql.js in', root)

try {
  execSync('pnpm remove better-sqlite3 @types/better-sqlite3', { cwd: root, stdio: 'inherit' })
} catch {
  console.log('[v0] better-sqlite3 not present, skipping remove')
}

execSync('pnpm add sql.js', { cwd: root, stdio: 'inherit' })
execSync('pnpm add -D @types/sql.js', { cwd: root, stdio: 'inherit' })

console.log('[v0] sql.js installed successfully')
