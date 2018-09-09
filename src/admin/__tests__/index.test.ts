import { getAdminSchema } from '../index'

jest.mock('graphql-tools', () => {
  return {
    makeExecutableSchema: (obj) => {
      return obj
    },
    mergeSchemas: (obj) => {
      return obj
    },
  }
})

jest.mock('../k8sSchema', () => {
  return {
    typeDefs: `k8sSchema Admin`,
    resolvers: {
      mock: true,
    },
  }
})

jest.mock('../generalSchema', () => {
  return {
    typeDefs: `generalSchema Admin`,
    resolvers: {
      mock: true,
    },
  }
})

describe('tests getAdminSchema', () => {
  const runtime = ['docker', 'kubernetesWatch', 'dockerWatch', 'kubernetes']

  runtime.map((one) => {
    it('tests by runtime: ' + one, () => {
      process.env.qglProxyRuntime = one
      expect(getAdminSchema()).toMatchSnapshot()
    })
  })

})
