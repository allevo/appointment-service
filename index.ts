import fastify, { FastifyInstance, FastifyPlugin } from 'fastify'

import FastifyFormBody from 'fastify-formbody'
import FastifySwagger from 'fastify-swagger'

import authPlugin, { JwtPluginOption } from './auth'
import appointmentPlugin, { MysqlPluginOption } from './appointment'

import { name, description, version } from './package.json'

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
      info: {
        title: name,
        description,
        version
      },
      tags: [
        {
          name: 'Authentication',
          description: 'Authentication APIs'
        },
        {
          name: 'Appointments',
          description: 'Appointments APIs'
        }
      ],
      securityDefinitions: {
        oAuthSample: {
          type: 'oauth2',
          description: 'foo',
          flow: 'password',
          tokenUrl: '/oauth/token',
          scopes: {
            qq: 'pp'
          }
        }
      }
    }
  })
  server.register(authPlugin, jwtOptions)
  server.register(appointmentPlugin, mysqlOptions)

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