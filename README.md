### Dependencies

- npm (to install pnpm) https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
- pnpm (package manager)
  - `npm install -g pnpm`
- bun (runtime for backend service) https://bun.sh/docs/installation
- docker https://www.docker.com/get-started/

## Follow these steps in order

### Setting up db

1. `docker-compose -f docker-compose.dev.yaml up db --build`
2. `cd services/db`
3. `pnpm migrate:generate && pnpm migrate:run && pnpm seed:emoji`

### Setting up backend

1. `docker-compose -f docker-compose.dev.yaml up fireside --build`

### Running frontend

1. `cd frontend`
2. `pnpm install`
3. `pnpm run dev`
