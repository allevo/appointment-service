import { FastifyInstance, FastifySchema, FastifyPlugin } from 'fastify'
import fp from 'fastify-plugin'
import FastifyJwt from 'fastify-jwt'

import AuthBodySchema from './schemas/auth_body.json'
import { AuthBodySchema as AuthBodySchemaInterface } from './types/auth_body'

import User from '../types/User'

export interface JwtPluginOption {
  secret: string;
}

const authPlugin: FastifyPlugin<JwtPluginOption> = fp(function (server, ops, done: Function) {
  server.register(FastifyJwt, { secret: ops.secret })

  server.decorate('getUser', async function (request: any): Promise<User> {
    return {
      id: Buffer.from(request.user.username).toString('hex'),
      username: request.user.username
    }
  })

  server.route<{
    Body: AuthBodySchemaInterface
  }>({
    url: '/oauth/token',
    method: 'POST',
    schema: {
      body: AuthBodySchema,
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            token_type: { type: 'string' }
          }
        }
      }
    },
    handler: async request => {
      const token = server.jwt.sign({ username: request.body.username })
      return {
        access_token: token,
        token_type: 'bearer'
      }
    }
  })
  server.get('/me', {
    schema: <FastifySchema>{
      tags: ['Authentication'],
      summary: 'Get me',
      security: [
        { oAuthSample: ['qq'] }
      ],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' }
          }
        }
      }
    },
    onRequest: request => request.jwtVerify(),
    handler: async request => {
      const user = await server.getUser(request)
      return user
    }
  })

  done()
})

module.exports = authPlugin
export default authPlugin

declare module 'fastify' {
  interface FastifyInstance {
    getUser(request: FastifyRequest): User;
  }
}
