#!/bin/bash

bun run /code/services/db/src/migrate.ts
bun run /code/services/backend/dist/index.js