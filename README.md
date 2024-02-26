### Dependencies

- npm (to install pnpm) https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
- pnpm (package manager)
  - `npm install -g pnpm`
- bun (runtime for backend service) https://bun.sh/docs/installation
- docker https://www.docker.com/get-started/

## Follow these steps in order

### Setting up db

1. `docker-compose up db --build`
1. `cd services/db`
1. `pnpm migrate:generate && pnpm migrate:run`

### Setting up backend

1. `cd backend`
2. `echo "CONNECTION_STRING=postgres://test_user:test_password@db/test_db" > .env`
3. `cd ../../`
4. `docker-compose up fireside --build`

### Running frontend

1. `cd frontend`
2. `pnpm install`
3. `echo "VITE_API_URL=http://localhost:8080" > .env`
4. `pnpm run dev`
5. Open http://localhost:5173/ in browser
