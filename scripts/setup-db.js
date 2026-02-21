const { execSync } = require('child_process');

console.log('--- Generating Prisma Client ---');
execSync('npx prisma generate', { stdio: 'inherit', cwd: '/vercel/share/v0-project' });

console.log('--- Pushing schema to SQLite ---');
execSync('npx prisma db push --force-reset', { stdio: 'inherit', cwd: '/vercel/share/v0-project' });

console.log('--- Seeding database ---');
execSync('node prisma/seed.js', { stdio: 'inherit', cwd: '/vercel/share/v0-project' });

console.log('--- Database setup complete ---');
