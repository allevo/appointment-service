import fastify, { FastifyInstance, FastifyPlugin } from 'fastify'

import FastifyFormBody from 'fastify-formbody'
import FastifySwagger from 'fastify-swagger'
import User from './types/User'

import loginPlugin, { JwtPluginOption } from './login'
import datePlugin, { MysqlPluginOption } from './appointment'

interface BePluginOption {
  mysql?: MysqlPluginOption,
  jwt?:  JwtPluginOption,
}

const be : FastifyPlugin<BePluginOption> = function (server, ops, done) {
  const mysqlOptions = ops.mysql || getDefaultMysqlOptions()
  const jwtOptions = ops.jwt || getDefaultJwtOptions()

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
  server.register(loginPlugin, jwtOptions)
  server.register(datePlugin, mysqlOptions)

  done()
}

function getDefaultMysqlOptions(obj = process.env): MysqlPluginOption {
  return {
    connectionLimit: 10,
    database: obj.MYSQL_DATABASE || '',
    host: obj.MYSQL_HOST || '',
    password: obj.MYSQL_PASSWORD || '',
    user: obj.MYSQL_USER || ''
  }
}

function getDefaultJwtOptions(obj = process.env): JwtPluginOption {
  return {
    secret: obj.JWT_SECRET || ''
  }
}

module.exports = be
export default be