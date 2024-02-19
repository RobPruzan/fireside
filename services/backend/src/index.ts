import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'

const app = new Elysia()
  .use(cors())
  .get('/test', () => {
    console.log('req')
    return 'Hello Elysia'
  })
  .listen(8080)
  

export type App = typeof app 