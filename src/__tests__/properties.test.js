import * as properties from '../properties'
import '../idx'
global.console = {
  log: (...args) => {
    expect(args).toMatchSnapshot()
  },
}

describe('tests Properties', () => {
  const data = {
    dockerNetwork: 'mock',
    gqlProxyToken: '123',
    VERSION: '0.0.0',
    BUILD_NUMBER: '12345',
    qglProxyRuntime: 'mockRuntime',
    gqlProxyKnownOldSchemas: true,
    kubernetesConfigurationKind: 'getInCluster',
    gqlProxyK8sUser: 'mocktesting',
    gqlProxyK8sUserPassword: 'topSecret',
    gqlProxyPollingMs: 10124,
    gqlProxyAdminUser: 'mockAdmin',
    gqlProxyAdminPassword: 'topSecretAdmin',
  }
  beforeAll(() => {

  })
  it('snapshot all properties', () => {
    expect(properties).toMatchSnapshot()
  })

  for (const one in properties){
    it ('snapshot ' + one + ' default return', () => {
      expect(properties[one]()).toMatchSnapshot()
    })
    it ('snapshot ' + one + ' given envs', () => {
      process.env = Object.assign({}, process.env, data)
      expect(properties[one]()).toMatchSnapshot()
      process.env = {}
    })
  }
})
