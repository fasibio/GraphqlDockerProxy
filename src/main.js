//@flow
import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import { weaveSchemas } from 'graphql-weaver'
import * as bodyParser from 'body-parser'
import { DockerFinder } from './finder/dockerFinder/dockerFinder'
import { K8sFinder } from './finder/k8sFinder/k8sFinder'
import { runtime, getPollingMs, printAllConfigs, adminPassword, adminUser, showPlayground } from './properties'
import type { Endpoints } from './finder/findEndpointsInterface'
import { sortEndpointAndFindAvailableEndpoints } from './finder/endpointsAvailable'
import adminSchema from './admin/adminSchema'
import basicAuth from 'express-basic-auth'
import cluster from 'cluster'
// import deepcopy from 'deepcopy/cjs/index'
import { getMergedInformation } from './schemaBuilder'


const weaverIt = async(endpoints) => {
  try {
    return await weaveSchemas({
      endpoints,
    })
  } catch (e){
    console.log('WeaverIt goes Wrong', e)
  }

}


const run = async() => {

  console.log('Start IT')
  console.log('With Configuration: ')
  printAllConfigs()
  let server = null
  let lastEndPoints : string = ''
  let finder

  switch (runtime()){
    case 'kubernetes':{
      finder = new K8sFinder()
      break
    }
    case 'docker': {
      finder = new DockerFinder()
    }

  }
  setInterval(async() => {
    try {
      let endpoints : Endpoints = await finder.getEndpoints()
      endpoints = await sortEndpointAndFindAvailableEndpoints(endpoints)
      if (JSON.stringify(endpoints) !== lastEndPoints){
        console.log('Changes Found restart Server')
        if (server != null){
          server.close()
        }

        lastEndPoints = JSON.stringify(endpoints)
        // $FlowFixMe: suppressing this error until we can refactor
        cluster.schedulingPolicy = cluster.SCHED_RR
        if (cluster.isMaster){
          var cpuCount = require('os').cpus().length
          for (var i = 0; i < cpuCount; i += 1) {
            console.log('START SLAVE')
            cluster.fork()
          }
        } else {
          server = await start(await finder.handleRestart(endpoints))
        }

      } else {
        console.log('no Change at endpoints does not need a restart')
      }
    } catch (e){
      console.log('GLOBAL ERROR', e)
      lastEndPoints = ''
    }

  }, getPollingMs())

}

// const oldSchema = null

const start = async(endpoints : Endpoints) => {

  const weaverEndpoints = []

  for (const one in endpoints){
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
  const app = express()
  let playground = false
  if (showPlayground()){
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
    schema: schemaMerged,
    playground: playground,
    introspection: true,
    context: (obj) => {
      return {
        context: {
          headers: obj.res.req.headers,
        },
      }
    },
  })
  apiServer.applyMiddleware({
    app,
    path: '/graphql',
    bodyParserConfig: bodyParser.json(),

  })

  app.get('/health', (req, res) => {
    res.status(200)
    res.send('OK')

  })


  if (adminUser() !== ''){
    const users = {}
    users[adminUser()] = adminPassword()
    app.use(basicAuth({
      users,
      challenge: true,
    }))
  }

  const adminServer = new ApolloServer({
    playground: playground,
    introspection: true,
    context: {
      endpoints: await endpoints,
    },
    schema: adminSchema,
  })
  adminServer.applyMiddleware({
    app,
    bodyParserConfig: bodyParser.json(),
    path: '/admin/graphql',
  })


  console.log('Server running. Open http://localhost:3000/graphql to run queries.')
  return app.listen(3000)
}

run()
