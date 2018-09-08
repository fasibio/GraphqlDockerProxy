import * as props from '../properties'

describe('testing the properties', () => {

  for (const one in props) {
    it('snapshot default result of propertie ' + one, () => {
      expect(props[one]()).toMatchSnapshot()
    })

  }

  describe('tests with given envs', () => {
    beforeAll(() => {
      process.env.dockerNetwork = 'mock'
      process.env.gqlProxyToken = 'mock'
      process.env.VERSION = 'mock'
      process.env.BUILD_NUMBER = 'mock'
      process.env.winstonLogLevel = 'mock'
      process.env.winstonLogStyle = 'mock'
      process.env.qglProxyRuntime = 'mock'
      process.env.enableClustering = 'mock'
      process.env.gqlProxyKnownOldSchemas = 'mock'
      process.env.kubernetesConfigurationKind = 'mock'
      process.env.gqlProxyK8sUser = 'mock'
      process.env.gqlProxyK8sUserPassword = 'mock'
      process.env.gqlProxyPollingMs = 'mock'
      process.env.gqlProxyPollingMs = 'mock'
      process.env.gqlProxyAdminUser = 'mock'
      process.env.gqlProxyAdminPassword = 'mock'
      process.env.gqlShowPlayground = 'mock'
      process.env.gqlBodyParserLimit = 'mock'
    })
    for (const one in props) {
      it('snapshot ' + one + ' is filled by env`s correctly', () => {
        expect(props[one]()).toMatchSnapshot()
      })
    }
  })
})
