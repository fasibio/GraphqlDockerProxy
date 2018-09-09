import { HttpLink } from 'apollo-link-http'
import { setContext } from 'apollo-link-context'
import { makeRemoteExecutableSchema, mergeSchemas, introspectSchema } from 'graphql-tools'
import fetch from 'node-fetch'
import  { Endpoint } from './interpreter/endpoints'

export const createRemoteSchema = async(url : string) => {
  const http = new HttpLink({ fetch, uri: url  })
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

export const getMergedInformation = async(namespace: Endpoint[]) => {
  const schema = []

  for (let i = 0; i < namespace.length; i = i + 1) {
    schema.push(await createRemoteSchema(namespace[i].url))
  }

  const merged = mergeSchemas({
    schemas: schema,
  })
  return merged
}
