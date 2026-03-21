#!/bin/bash
set -e
cd /vercel/share/v0-project
pnpm remove better-sqlite3 @types/better-sqlite3 || true
pnpm add sql.js
pnpm add -D @types/sql.js
echo "sql.js installed successfully"
