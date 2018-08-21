import { K8sWatcher } from '../K8sWatcher'


describe('tests the K8sWatcher', () => {

  let k8sWatcher = null
  let endpoints = {}
  beforeEach(() => {
    k8sWatcher = new K8sWatcher()
    endpoints = { swapi:
      [ { url: 'http://swapi.starwars:9002/graphql',
        namespace: 'swapi',
        typePrefix: 'swapi_',
        __created: '2018-08-21T05:39:17Z',
        __imageID: '',
        __deploymentName: 'swapi' } ] }
  })
  it ('tests __deleteEndpoint function', () => {
    k8sWatcher.endpoints = endpoints
    k8sWatcher.__deleteEndpoint('swapi', 'swapi')
    expect(k8sWatcher.endpoints).toEqual({})

  })
})
