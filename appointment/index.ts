import { FastifyInstance, FastifyPlugin } from 'fastify'
import fp from 'fastify-plugin'

import mysql from 'mysql'

import AppointmentManager, { Appointment } from './lib/AppointmentManager'

import CreateBodySchema from './schemas/create_appointment_body.json'
import { CreateBodySchema as CreateBodySchemaInterface } from './types/create_appointment_body'

import DeleteParamsSchema from './schemas/delete_appointment_params.json'
import { DeleteParamsSchema as DeleteParamsSchemaInterface } from './types/delete_appointment_params'

import GetParamsSchema from './schemas/get_appointment_params.json'
import { GetParamsSchema as GetParamsSchemaInterface } from './types/get_appointment_params'

import WeekParamsSchema from './schemas/week_appointment_params.json'
import { WeekParamsSchema as WeekParamsSchemaInterface } from './types/week_appointment_params'

export interface MysqlPluginOption {
  connectionLimit: number,
  host: string,
  user: string,
  password: string,
  database: string,
}

const appointmentPlugin: FastifyPlugin<MysqlPluginOption> = fp(function (server: FastifyInstance, ops: MysqlPluginOption, done: Function) {
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
      tags: ['Appointments'],
      body: CreateBodySchema,
      summary: 'Create a new appointment',
      security: [
        { oAuthSample: ['qq'] }
      ],
      response: {
        200: appointmentJsonSchema
      }
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
      tags: ['Appointments'],
      params: DeleteParamsSchema,
      summary: 'Delete a new appointment',
      security: [
        { oAuthSample: ['qq'] }
      ]
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
      tags: ['Appointments'],
      params: GetParamsSchema,
      summary: 'Get an appointment',
      security: [
        { oAuthSample: ['qq'] }
      ],
      response: {
        200: appointmentJsonSchema
      }
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
      tags: ['Appointments'],
      params: WeekParamsSchema,
      summary: 'Get appointments per week',
      security: [
        { oAuthSample: ['qq'] }
      ],
      response: {
        200: {
          type: 'array',
          items: appointmentJsonSchema
        }
      }
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

const appointmentJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    startDate: { type: 'string' },
    endDate: { type: 'string' },
    creatorId: { type: 'string' },
    creatorUsername: { type: 'string' }
  }
}

module.exports = appointmentPlugin
export default appointmentPlugin
