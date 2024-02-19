### Setting up db

1. `cd src`
2. `touch .env` (should add CONNECTION_STRING=...)
3. `pnpm install`
4. `pnpm migrate`
5. `bun src/migrate.ts`
