### Running frontend

1. install pnpm (requires having npm already installed, if not use this guide https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) `npm install -g pnpm`
2. `cd frontend`
3. `pnpm install`
4. `touch .env && echo "VITE_API_URL=http://localhost:8080" > .env`
5. `pnpm run dev`
6. Open http://localhost:5173/ in browser

### Running backend

1. install pnpm (requires having npm already installed, if not use this guide https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) `npm install -g pnpm`
2. `cd backend`
3. `pnpm install`
4. `pnpm run dev`
5. Open http://localhost:8080/test in browser

### Setting up db

1. `cd src`
2. `touch .env` (should add CONNECTION_STRING=...)
3. `pnpm install`
4. `pnpm migrate`
5. `bun src/migrate.ts`
