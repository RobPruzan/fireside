#!/bin/bash
echo "migrating"
bun run /code/services/db/src/migrate.ts

# bun run /code/services/db/src/seed-emoji.ts
# echo "seeding emoji"
# bun run /code/services/db/src/seed-ai.ts
# echo "seeding ai"
echo "Running server"
bun run --watch /code/services/backend/dist/index.js
