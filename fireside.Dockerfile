FROM node:20-alpine AS build
WORKDIR /code

RUN npm install -g pnpm
COPY . .
RUN pnpm install --force


WORKDIR /code/services/frontend
RUN pnpm run build
WORKDIR /code/services/db

RUN pnpm run migrate:generate

FROM oven/bun:1.0.0 AS bun-runtime

COPY --from=build /code /code

WORKDIR /code/services/db

WORKDIR /code/services/backend

RUN bun run build
RUN chmod +x /code/entrypoint.sh
ENTRYPOINT [ "/code/entrypoint.sh" ]