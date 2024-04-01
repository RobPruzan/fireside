FROM node:20-alpine AS build
WORKDIR /code
ENV NODE_ENV=development
RUN npm install -g pnpm
COPY . .
RUN pnpm install
# RUN pnpm install aws-sdk
# RUN pnpm install typescript @types/node --save-dev

FROM oven/bun:1.0.0 AS bun-runtime

COPY --from=build /code /code
WORKDIR /code/services/backend
CMD ["bun", "run", "dev"]
