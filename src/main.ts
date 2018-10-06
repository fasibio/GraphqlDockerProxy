import { ApolloServer } from 'apollo-server-express'
import * as express from 'express'
import * as core from 'express-serve-static-core'
import { weaveSchemas } from 'graphql-weaver'
import * as http from 'http'
import {
  getPollingMs,
  printAllConfigs,
  adminPassword,
  adminUser,
  showPlayground,
  getBodyParserLimit,
  getEnableClustering,
  getLogFormat,
  getLogLevel,
  sendIntrospection,
} from './properties'
import { Interpreter } from './interpreter/Interpreter'
import  { Endpoints } from './interpreter/endpoints'
import { sortEndpointAndFindAvailableEndpoints } from './interpreter/endpointsAvailable'
import { getAdminSchema } from './admin'
import * as cluster from 'cluster'
import * as basicAuth from 'express-basic-auth'
import * as cloner from 'cloner'
import { getMergedInformation } from './schemaBuilder'
require('./idx')
import { loadLogger } from './logger'
import { loadRuntimeInfo } from './runtimeIni'
loadLogger({
  logFormat: getLogFormat(),
  loglevel: getLogLevel(),
})

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})
const weaverIt = async(endpoints) => {
  try {
    return await weaveSchemas({
      endpoints,
    })
  } catch (e) {
    winston.error('WeaverIt goes Wrong', e)
  }

}
let foundedEndpoints: Endpoints = {}
const run = async() => {
  winston.info('Start IT')
  winston.info('With Configuration: ')

  let interpreter: Interpreter = null

  printAllConfigs()
  let handleRestart = (endpoint: Endpoints) => {
    return Promise.resolve(endpoint)
  }
  loadRuntimeInfo((obj) => {
    interpreter = obj.interpreter
    handleRestart = obj.handleRestart
    foundedEndpoints = obj.foundedEndpoints

  })
  setInterval(() => {
    startWatcher(cloner.deep.copy(foundedEndpoints), handleRestart, interpreter)
  },          getPollingMs())

}

// start and restart by listener
let lastEndPoints : string = ''
let server: http.Server = null

const startWatcher = async(end: Endpoints,
                           handleRestart:(endpoints:Endpoints) => Promise<Endpoints>, interpreter: Interpreter) => {
  const endpoints = await sortEndpointAndFindAvailableEndpoints(end)
  if (JSON.stringify(endpoints) !== lastEndPoints) {
    winston.info('Changes Found restart Server')
    if (winston.level === 'debug' && lastEndPoints !== '') {

    }
    lastEndPoints = JSON.stringify(endpoints)
    await start(await handleRestart(endpoints), interpreter)

  } else {
    winston.debug('no Change at endpoints does not need a restart')
  }
}

let app :core.Express = null
const start = async(endpoints : Endpoints, interpreter: Interpreter) => {
  winston.info('loading endpoints', { endpoints })
  const weaverEndpoints = []

  for (const one in endpoints) {
    weaverEndpoints.push({
      namespace: one,
      typePrefix: one + '_',
      schema: await getMergedInformation(endpoints[one]),
    })
  }
  const schema = await weaverIt(weaverEndpoints)
  let schemaMerged = null
  schemaMerged = schema
  app = express()
  let playground: any = false
  if (showPlayground()) {
    playground = {
      tabs: [{
        endpoint: '/graphql',

      },
        {
          endpoint: '/admin/graphql',
          headers: {
            Authorization: 'Basic YOURBasicAuth',
          },
        },
      ],

    }
  }
  const apiServer = new ApolloServer({
    playground,
    schema: schemaMerged,
    introspection: sendIntrospection(),
    context: (obj) => {
      return {
        headers: obj.res.req.headers,
      }
    },
  })

  apiServer.applyMiddleware({
    app,
    path: '/graphql',
    bodyParserConfig: { limit: getBodyParserLimit() },

  })

  app.get('/health', (req, res) => {
    res.status(200)
    res.send('OK')

  })

  if (adminUser() !== '') {
    const users = {}
    users[adminUser()] = adminPassword()
    app.use(basicAuth({
      users,
      challenge: true,
    }))
  }

  const adminServer = new ApolloServer({
    playground,
    introspection: true,
    context: {
      interpreter,
      endpoints: await endpoints,
    },
    schema: getAdminSchema(),
  })
  adminServer.applyMiddleware({
    app,
    bodyParserConfig: true,
    path: '/admin/graphql',
  })

  winston.info('Server running. Open http://localhost:3000/graphql to run queries.')
  if (server != null) {
    server.close(() => {
      server = app.listen(3000)
    })
  }else {
    server =  app.listen(3000)
  }
}

if (getEnableClustering()) {
  process.env['NODE_CLUSTER_SCHED_POLICY'] = 'rr'
  if (cluster.isMaster) {
    const cpuCount = require('os').cpus().length
    for (let i = 0; i < cpuCount; i += 1) {
      cluster.fork()
    }
  } else {
    winston.info('START Slave')
    run()
  }
} else {
  run()
}

/**
 * Shutdownhandler
 */

const signals = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGTERM: 15,
}
const shutdown = (signal, value) => {
  winston.info('shutdown!')
  if (server === null) {
    process.exit(128 + value)
  } else {
    winston.info(`server stopped by ${signal} with value ${value}`)
    server.close(() => {
      process.exit(128 + value)
    })
  }
}
Object.keys(signals).forEach((signal) => {
  (process as NodeJS.EventEmitter).on(signal, () => {
    winston.debug(`process received a ${signal} signal`)
    shutdown(signal, signals[signal])
  })
})
