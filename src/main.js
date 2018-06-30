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
import { runtime, getPollingMs, printAllConfigs } from './properties'
import type { Endpoints, Endpoint } from './finder/findEndpointsInterface'
import { sortEndpointAndFindAvailableEndpoints } from './finder/endpointsAvailable'
import adminSchema from './admin/adminSchema'
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
        server = await start(await finder.handleRestart(endpoints))
      } else {
        console.log('no Change at endpoints does not need a restart')
      }
    } catch (e){
      console.log('GLOBAL ERROR', e)
      lastEndPoints = ''
    }

  }, getPollingMs())

}

const start = async(endpoints : Endpoints) => {

  const weaverEndpoints = []

  for (const one in endpoints){
    if (endpoints[one].length === 1){
      weaverEndpoints.push(endpoints[one][0])
    } else {
      console.log('Found more than one endpoint in same namespace start Merge', endpoints[one])
      weaverEndpoints.push({
        namespace: one,
        typePrefix: one + '_',
        schema: await getMergedInformation(endpoints[one]),
      })
    }
  }
  // console.log(weaverEndpoints)
  // const schema = mergeSchemas({
  //   schemas: [
  //     mobileshop, fasibioAuth,
  //   ],
  // })
  const schema = await weaverIt(weaverEndpoints)
  const app = express()
  app.use('/admin/graphql', bodyParser.json(), graphqlExpress({
    context: {
      endpoints: await endpoints,
    },
    schema: adminSchema,
  }))
  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }))
  app.use(
    '/admin/graphiql',
    graphiqlExpress({
      endpointURL: '/admin/graphql',
    })
  )
  app.use(
    '/graphiql',
    graphiqlExpress({
      endpointURL: '/graphql',
    })
  )
  console.log('Server running. Open http://localhost:3000/graphiql to run queries.')
  return app.listen(3000)
}

run()
