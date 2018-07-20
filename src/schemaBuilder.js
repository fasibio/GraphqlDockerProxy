import { HttpLink } from 'apollo-link-http'
import { setContext } from 'apollo-link-context'
import { makeRemoteExecutableSchema, mergeSchemas, introspectSchema } from 'graphql-tools'
import fetch from 'node-fetch'
import type { Endpoint } from './finder/findEndpointsInterface'


export const createRemoteSchema = async(url) => {
  const http = new HttpLink({ uri: url, fetch })
  const link = setContext((request, previousContext) => {
    return previousContext.graphqlContext
  }).concat(http)

  const schema = await introspectSchema(link)
  const executableSchema = makeRemoteExecutableSchema({
    schema,
    link,
  })
  return executableSchema
}

export const getMergedInformation = async(namespace: Array<Endpoint>) => {
  const schema = []

  for (let i = 0; i < namespace.length; i++){
    schema.push(await createRemoteSchema(namespace[i].url))
  }

  const merged = mergeSchemas({
    schemas: schema,
  })
  return merged
}
