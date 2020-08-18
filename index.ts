import fastify, { FastifyInstance, FastifyPlugin } from 'fastify'

import FastifyFormBody from 'fastify-formbody'
import FastifySwagger from 'fastify-swagger'
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
  server.register(loginPlugin)
  server.register(datePlugin, {
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'my-db',
    prefix: '/appointment',
  })

  done()
}

module.exports = aa
export default aa