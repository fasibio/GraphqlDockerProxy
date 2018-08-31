import { ApolloServer } from 'apollo-server-express'
import * as express from 'express'
import * as core from 'express-serve-static-core'
import { weaveSchemas } from 'graphql-weaver'
import { DockerFinder } from './interpreter/finder/dockerFinder/dockerFinder'
import { K8sFinder } from './interpreter/finder/k8sFinder/k8sFinder'
import { K8sWatcher } from './interpreter/watcher/k8s/K8sWatcher'
import { diff } from 'deep-object-diff'
import * as http from 'http'
import {
  runtime,
  getPollingMs,
  printAllConfigs,
  adminPassword,
  adminUser,
  showPlayground,
  getBodyParserLimit,
  getEnableClustering,
  getResetEndpointTime,
  getLogFormat,
  getLogLevel,
} from './properties'
import { Interpreter } from './interpreter/Interpreter'
import  { Endpoints } from './interpreter/endpoints'
import { sortEndpointAndFindAvailableEndpoints } from './interpreter/endpointsAvailable'
import { getAdminSchema } from './admin'
import * as cluster from 'cluster'
import * as basicAuth from 'express-basic-auth'
import * as cloner from 'cloner'
import { DockerWatcher } from './interpreter/watcher/docker/DockerWatcher'
// import deepcopy from 'deepcopy/cjs/index'
import { getMergedInformation } from './schemaBuilder'
require('./idx')
import { loadLogger } from './logger'
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
  switch (runtime()){
    case 'kubernetes': {
      const k8sFinder = new K8sFinder()
      setInterval(async() => {
        foundedEndpoints = await k8sFinder.getEndpoints()
      },          getPollingMs())
      handleRestart = k8sFinder.handleRestart
      interpreter = k8sFinder
      break
    }
    case 'docker': {
      const dockerFinder = new DockerFinder()
      setInterval(async() => {
        foundedEndpoints = await dockerFinder.getEndpoints()
      },          getPollingMs())
      handleRestart = dockerFinder.handleRestart
      interpreter = dockerFinder
      break
    }

    case 'kubernetesWatch': {
      const watcher = new K8sWatcher()
      watcher.setDataUpdatedListener((endpoints) => {
        winston.info('Watcher called new endpoints ', { endpoints })
        foundedEndpoints = endpoints
      })
      watcher.watchEndpoint()
      setInterval(() => {
        winston.info('Reset Watching from K8S endpoints (work a around)')
        watcher.abortAllStreams()
        watcher.watchEndpoint()
      },          getResetEndpointTime())
      interpreter = watcher
      break
    }
    case 'dockerWatch': {
      const dockerWatcher = new DockerWatcher()
      dockerWatcher.watchEndpoint()
      dockerWatcher.setDataUpdatedListener((endpoints) => {
        winston.info('Watcher called new endpoints ')
        console.log(endpoints)
        foundedEndpoints = endpoints
      })
      handleRestart = dockerWatcher.handleRestart
      interpreter = dockerWatcher
    }

  }
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
      winston.debug('The Changes: ' , diff(JSON.parse(lastEndPoints), endpoints))
    }
    lastEndPoints = JSON.stringify(endpoints)
    // cluster.schedulingPolicy = cluster.SCHED_RR
    // if (cluster.isMaster){
    //   var cpuCount = require('os').cpus().length
    //   for (var i = 0; i < cpuCount; i += 1) {
    //     console.log('START SLAVE')
    //     cluster.fork()
    //   }
    // } else {
    server = await start(await handleRestart(endpoints), interpreter)
    // }

  } else {
    winston.debug('no Change at endpoints does not need a restart')
  }
}
// const runPoller = (finder) => {

//   setInterval(async() => {
//     try {
//       let endpoints : Endpoints = await finder.getEndpoints();
//       endpoints = await sortEndpointAndFindAvailableEndpoints(endpoints);
//       if (JSON.stringify(endpoints) !== lastEndPoints) {
//         winston.info('Changes Found restart Server');
//         if (server != null) {
//           server.close();
//         }

//         lastEndPoints = JSON.stringify(endpoints);
//         process.env.NODE_CLUSTER_SCHED_POLICY = 'rr';
//         if (cluster.isMaster) {
//           const cpuCount = require('os').cpus().length;
//           for (let i = 0; i < cpuCount; i += 1) {
//             winston.info('START SLAVE');
//             cluster.fork();
//           }
//         } else {
//           server = await start(await finder.handleRestart(endpoints));
//         }

//       } else {
//         winston.info('no Change at endpoints does not need a restart');
//       }
//     } catch (e) {
//       winston.error('GLOBAL ERROR', e);
//       lastEndPoints = '';
//     }

//   },          getPollingMs());
// };
// const oldSchema = null
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
  // if (knownOldSchemas() == 'true'){

  //   if (oldSchema != null){
  //     console.log('merge Old and New Schemas. to known old Schemas', oldSchema)
  //     schemaMerged = mergeSchemas({
  //       schemas: [schema, oldSchema],
  //     })
  //   } else {
  schemaMerged = schema
  // }

  // oldSchema = deepcopy(schemaMerged)
  // }
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
    introspection: true,
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
    return server
  }

  return app.listen(3000)

}
// process.env['NODE_CLUSTER_SCHED_POLICY'] = 'rr';
// if (cluster.isMaster) {
//   const cpuCount = require('os').cpus().length;
//   for (let i = 0; i < cpuCount; i += 1) {
//     cluster.fork();
//   }
// } else {
  // winston.info('START Slave');

// }

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

// The signals we want to handle
// NOTE: although it is tempting, the SIGKILL signal (9) cannot be intercepted and handled
const signals = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGTERM: 15,
}
// Do any necessary shutdown logic for our application here
const shutdown = (signal, value) => {
  winston.info('shutdown!')
  server.close(() => {
    winston.info(`server stopped by ${signal} with value ${value}`)
    server.close(() => {
      process.exit(128 + value)
    })
  })
}
// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {

  (process as NodeJS.EventEmitter).on(signal, () => {
    winston.debug(`process received a ${signal} signal`)
    shutdown(signal, signals[signal])
  })
})
