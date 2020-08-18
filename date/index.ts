import { FastifyInstance, FastifyPlugin } from 'fastify'
import fp from 'fastify-plugin'

import mysql from 'mysql'

import AppointmentManager, { Appointment } from './lib/AppointmentManager'

import CreateBodySchema from './schemas/create_date_body.json'
import { CreateBodySchema as CreateBodySchemaInterface } from './types/create_date_body'

import DeleteParamsSchema from './schemas/delete_date_params.json'
import { DeleteParamsSchema as DeleteParamsSchemaInterface } from './types/delete_date_params'

import GetParamsSchema from './schemas/get_date_params.json'
import { GetParamsSchema as GetParamsSchemaInterface } from './types/get_date_params'

import WeekParamsSchema from './schemas/week_date_params.json'
import { WeekParamsSchema as WeekParamsSchemaInterface } from './types/week_date_params'

export interface MysqlPluginOption {
  connectionLimit: number,
  host: string,
  user: string,
  password: string,
  database: string,
}

const datePlugin: FastifyPlugin<MysqlPluginOption> = fp(function (server: FastifyInstance, ops: MysqlPluginOption, done: Function) {
  const pool = mysql.createPool({
    connectionLimit: ops.connectionLimit,
    host: ops.host,
    user: ops.user,
    password: ops.password,
    database: ops.database
  })
  server.addHook('onClose', (_, done) => pool.end(done))

  const appointmentManager = new AppointmentManager(pool)

  server.post<{
    Body: CreateBodySchemaInterface
  }>('/appointments/', {
    schema: {
      body: CreateBodySchema,
      summary: 'Create a new appointment',
      security: [
        { oAuthSample: ['qq'] }
      ]
    },
    onRequest: request => request.jwtVerify(),
    handler: async request => {
      const user = await server.getUser(request)
      const appointment = <Appointment>{
        title: request.body.title,
        description: request.body.description,
        startDate: new Date(request.body.startDate),
        endDate: new Date(request.body.endDate),
        creatorId: user.id,
        creatorUsername: user.username
      }
      const appointmentOnDatabase = await appointmentManager.insertAppointment(request.log, appointment)
      return appointmentOnDatabase
    }
  })

  server.delete<{
    Params: DeleteParamsSchemaInterface
  }>('/appointments/:id', {
    schema: {
      params: DeleteParamsSchema
    },
    onRequest: request => request.jwtVerify(),
    handler: async (request, reply) => {
      // const user = await server.getUser(request)
      await appointmentManager.cancelAppointment(request.log, request.params.id)

      reply.code(204)
    }
  })

  server.get<{
    Params: GetParamsSchemaInterface
  }>('/appointments/:id', {
    schema: {
      params: GetParamsSchema
    },
    onRequest: request => request.jwtVerify(),
    handler: async (request, reply) => {
      // const user = await server.getUser(request)
      try {
        const appointmentOnDatabase = await appointmentManager.getAppointment(request.log, request.params.id)
        return appointmentOnDatabase
      } catch (e) {
        if (e.message === 'NOT_FOUND') {
          reply.status(404)
          return {}
        }
        throw e
      }
    }
  })

  server.get<{
    Params: WeekParamsSchemaInterface
  }>('/appointments/year/:year/week/:week', {
    schema: {
      params: WeekParamsSchema
    },
    onRequest: request => request.jwtVerify(),
    handler: async request => {
      // const user = await server.getUser(request)
      const {
        year, week
      } = request.params
      const appointmentOnDatabase = await appointmentManager.getAppointmentsByWeek(request.log, year, week)
      return appointmentOnDatabase
    }
  })

  done()
})

module.exports = datePlugin
export default datePlugin
