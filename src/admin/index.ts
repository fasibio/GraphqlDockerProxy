import * as generalSchema from './generalSchema'
import * as k8sSchema from './k8sSchema'
import { runtime } from '../properties'
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools'
// https://blog.apollographql.com/modularizing-your-graphql-schema-code-d7f71d5ed5f2
export const getAdminSchema = () => {
  const runt = runtime()

  const schemas = []
  if (runt === 'kubernetes' || runt === 'kubernetesWatch') {
    schemas.push(makeExecutableSchema({
      typeDefs: k8sSchema.typeDefs,
      resolvers: k8sSchema.resolvers,
    }))
  }
  schemas.push(makeExecutableSchema({
    typeDefs: generalSchema.typeDefs,
    resolvers: generalSchema.resolvers,
  }))

  return  mergeSchemas({ schemas })

}
