#!/bin/bash

bun run /code/services/db/src/migrate.ts
bun run /code/services/db/src/seed-emoji.ts
bun run --watch /code/services/backend/dist/index.js