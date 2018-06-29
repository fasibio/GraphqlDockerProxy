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
import { runtime, getPollingMs } from './properties'
import type { Endpoints, Endpoint } from './finder/findEndpointsInterface'
// import { sortEndpointAndFindAvailableEndpoints } from './finder/endpointsAvailable'
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
  console.log('weaverIt', endpoints)

  return await weaveSchemas({
    endpoints,
  })
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
    const endpoints : Endpoints = await finder.getEndpoints()
    console.log('Enpoint Result: ', JSON.stringify(endpoints))

    if (JSON.stringify(endpoints) !== lastEndPoints){
      console.log('Changes Found restart Server')
      if (server != null){
        server.close()
      }

      lastEndPoints = JSON.stringify(endpoints)
      server = await start(finder.handleRestart(endpoints))
    } else {
      console.log('no Change at endpoints does not need a restart')
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
  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }))
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
