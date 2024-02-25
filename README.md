### Dependencies

- npm (to install pnpm) https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
- pnpm (package manager)
  - `npm install -g pnpm`
- bun (runtime for backend and db service) https://bun.sh/docs/installation

### Running frontend

1. `cd frontend`
2. `pnpm install`
3. `touch .env && echo "VITE_API_URL=http://localhost:8080" > .env`
4. `pnpm run dev`
5. Open http://localhost:5173/ in browser

### Running backend

1. `cd backend`
2. `pnpm install`
3. `pnpm run dev`
4. Open http://localhost:8080/test in browser

### Setting up db

1. `cd src`
2. `touch .env` (should add CONNECTION_STRING=...)
3. `pnpm install`
4. `pnpm migrate`
5. `bun src/migrate.ts`
