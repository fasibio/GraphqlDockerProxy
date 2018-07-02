//@flow
import { makeRemoteExecutableSchema, mergeSchemas, introspectSchema } from 'graphql-tools'
import { graphqlExpress,
  graphiqlExpress,
} from 'apollo-server-express'
import express from 'express'
import { weaveSchemas } from 'graphql-weaver'
import { HttpLink } from 'apollo-link-http'
import fetch from 'node-fetch'
import * as bodyParser from 'body-parser'
import { DockerFinder } from './finder/dockerFinder/dockerFinder'
import { K8sFinder } from './finder/k8sFinder/k8sFinder'
import { runtime, getPollingMs, printAllConfigs, adminPassword, adminUser, knownOldSchemas } from './properties'
import type { Endpoints, Endpoint } from './finder/findEndpointsInterface'
import { sortEndpointAndFindAvailableEndpoints } from './finder/endpointsAvailable'
import adminSchema from './admin/adminSchema'
import basicAuth from 'express-basic-auth'
import cluster from 'cluster'
// import deepcopy from 'deepcopy/cjs/index'

const createRemoteSchema = async(url) => {
  const link = new HttpLink({ uri: url, fetch })
  const schema = await introspectSchema(link)
  const executableSchema = makeRemoteExecutableSchema({
    schema,
    link,
  })
  return executableSchema
}

const weaverIt = async(endpoints) => {
  try {
    return await weaveSchemas({
      endpoints,
    })
  } catch (e){
    console.log('WeaverIt goes Wrong', e)
  }

}

const getMergedInformation = async(namespace: Array<Endpoint>) => {
  const schema = []

  for (let i = 0; i < namespace.length; i++){
    schema.push(await createRemoteSchema(namespace[i].url))
  }

  const merged = mergeSchemas({
    schemas: schema,
  })
  return merged
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
  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema: schemaMerged }))

  app.use(
    '/graphiql',
    graphiqlExpress({
      endpointURL: '/graphql',
    })
  )

  if (adminUser() !== ''){
    const users = {}
    users[adminUser()] = adminPassword()
    app.use(basicAuth({
      users,
      challenge: true,
    }))
  }

  app.use('/admin/graphql', bodyParser.json(), graphqlExpress({
    context: {
      endpoints: await endpoints,
    },
    schema: adminSchema,
  }))
  app.use(
    '/admin/graphiql',
    graphiqlExpress({
      endpointURL: '/admin/graphql',
    })
  )
  console.log('Server running. Open http://localhost:3000/graphiql to run queries.')
  return app.listen(3000)
}

run()
