import fastify, { FastifyInstance, FastifyPlugin } from 'fastify'

import FastifyFormBody from 'fastify-formbody'
import FastifySwagger from 'fastify-swagger'
import fp from 'fastify-plugin'
import User from './types/User'

import  loginPlugin from './login'
import  datePlugin from './date'

const aa : FastifyPlugin<any> = function (server, ops, done) {
  server.register(FastifyFormBody)
  server.register(FastifySwagger, {
    routePrefix: '/documentation',
    exposeRoute: true,
    swagger: {
      securityDefinitions: {
        oAuthSample: {
          type: 'oauth2',
          description: 'foo',
          flow: 'password',
          tokenUrl: '/auth',
          scopes: {
            qq: 'pp'
          }
        }
      }
    }
  })
  server.register(fp(loginPlugin))
  server.register(datePlugin)

  done()
}

module.exports = aa
export default aa