import { FastifyInstance, FastifySchema, FastifyPlugin } from 'fastify'
import fp from 'fastify-plugin'
import FastifyJwt from 'fastify-jwt'

import AuthBodySchema from './schemas/auth_body.json'
import { AuthBodySchema as AuthBodySchemaInterface } from './types/auth_body'

import User from '../types/User'

export interface JwtPluginOption {
  secret: string;
}

const loginPlugin: FastifyPlugin<JwtPluginOption> = fp(function (server, ops, done: Function) {
  server.register(FastifyJwt, { secret: ops.secret })
  
  server.decorate('getUser', async function (request: any): Promise<User> {
    return {
      id: Buffer.from(request.user.username).toString('hex'),
      username: request.user.username,
    }
  })

  server.route<{ 
    Body: AuthBodySchemaInterface
  }>({
    url: '/auth',
    method: 'POST',
    schema: {
      body: AuthBodySchema,
    },
    handler: async (request, reply) => {
      const token = server.jwt.sign({ username: request.body.username })
      return {
        access_token: token,
        token_type: 'bearer',
      }
    }
  })
  server.get('/me', {
    schema: <FastifySchema>{
      summary: 'Get me',
      security: [
        { oAuthSample: [ 'qq' ] }
      ]
    },
    onRequest: request => request.jwtVerify(),
    handler: async (request, reply) => {
      const user = await server.getUser(request)
      return user
    }
  })

  done()
})

module.exports = loginPlugin
export default loginPlugin

declare module 'fastify' {
  interface FastifyInstance {
    getUser(request: FastifyRequest): User;
  }
}
