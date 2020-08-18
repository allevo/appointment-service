import Fastify from 'fastify'
import t from 'tap'
import { v4 as uuidV4 } from 'uuid'

import index from '../index'

import { setUpDatabase } from './AppointmentManager.test'

t.test('appointments', async t => {
  const fastify = Fastify()

  const databaseName = 'my-db-' + uuidV4()
  await setUpDatabase(t, fastify.log, databaseName)
  const username = 'my-username'

  fastify.register(index, {
    mysql: {
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: databaseName,
      connectionLimit: 10,
    },
    jwt: {
      secret: 'wow'
    }
  })

  const loginResponse = await fastify.inject({
    method: 'POST',
    path: '/auth',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    payload: 'grant_type=password&username=' + username + '&password=foo'
  })

  t.equals(loginResponse.statusCode, 200)
  const loginOutput = JSON.parse(loginResponse.payload)
  t.ok(loginOutput.access_token)

  const meResponse = await fastify.inject({
    method: 'POST',
    path: '/appointments/',
    headers: {
      'Authorization': 'Bearer ' + loginOutput.access_token
    },
    payload: {
      title: 'my-title',
      creatorId: 'my-creator-id',
      creatorUsername: 'my-creator-username',
      description: 'the description',
      startDate: new Date('2020-08-18T15:00:00Z').toISOString(),
      endDate: new Date('2020-08-18T16:00:00Z').toISOString(),
    }
  })

  t.equals(meResponse.statusCode, 200, meResponse.payload)
  const meOutput = JSON.parse(meResponse.payload)
  t.equals(meOutput.creatorUsername, username)
  t.ok(meOutput.id)

  t.end()
})
