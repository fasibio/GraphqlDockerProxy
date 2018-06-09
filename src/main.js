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

const getMergedInformation = async(namespace) => {
  const schema = []
  for (const oneEndpoint in namespace){
    schema.push(await createRemoteSchema(namespace[oneEndpoint].url))
  }
  const merged = mergeSchemas({
    schemas: schema,
  })
  return merged
}


const run = async() => {

  console.log('Start IT')
  let server = null
  let lastEndPoints = null
  const dockerFinder = new DockerFinder()
  setInterval(async() => {
    const endpoints = await dockerFinder.getEndpoints()

    if (JSON.stringify(endpoints) !== lastEndPoints){
      console.log('Changes Found restart Server')
      if (server != null){
        server.close()
      }
      lastEndPoints = JSON.stringify(endpoints)
      server = await start(dockerFinder.handleRestart(endpoints))
    } else {
      console.log('no Change at endpoints does not need a restart')
    }
  }, 5000)

}

const start = async(endpoints) => {

  const weaverEndpoints = []

  for (const one in endpoints){
    if (endpoints[one].length === 1){
      weaverEndpoints.push(endpoints[one][0])
    } else {

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
