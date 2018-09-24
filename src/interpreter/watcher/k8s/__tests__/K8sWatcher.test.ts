import { K8sWatcher } from '../K8sWatcher'
import { Readable } from 'stream'
import { Endpoints } from '../../../endpoints'
jest.mock('../../../endpointsAvailable', () => {
  return {
    allEndpointsAvailable: () => true,
    sortEndpointAndFindAvailableEndpoints: (endpoints) => {
      return endpoints
    },
  }
})

jest.mock('../../../../properties', () => {
  return {
    token: () => {
      return '123'
    },
  }
})

describe('tests the K8sWatcher', () => {

  let k8sWatcher : K8sWatcher = null
  let endpoints: Endpoints = {}
  beforeEach(() => {
    k8sWatcher = new K8sWatcher()
    endpoints = {
      swapi:
      [
        { url: 'http://swapi.starwars:9002/graphql',
          namespace: 'swapi',
          typePrefix: 'swapi_',
          __imageID: '',
          __deploymentName: 'swapi',
        },

      ],
    }
  })

  describe('tests the updatelistener is called by service stream', () => {
    let mockStream = null
    beforeEach(() => {
      mockStream = new Readable()
      k8sWatcher.client = {
        api: {
          v1: {
            watch: {
              namespaces: () => {
                return {
                  services: {
                    getStream: () => {
                      mockStream._read = function () { /* do nothing */ }
                      return mockStream
                    },
                  },
                }
              },
            },
          },
        },
      }
    })

    it('tests addService', async() => {
      const callMockFunc = jest.fn()
      k8sWatcher.setDataUpdatedListener(callMockFunc)
      k8sWatcher.watchServicesForNamespace('mock')
      console.log('hier')
      const mockStreamObj = {
        type: 'ADDED',
        object: {
          metadata: {
            name: 'mockName',
            namespace: 'mockNamespace',
            annotations:{
              'gqlProxy.token':'123',
              'gqlProxy.url': ':9000/graph',
              'gqlProxy.namespace': 'mockgqlNamespace',
            },
            creationTimestamp: 'mock',
            resourceVersion: 'mock',
          },
          spec: {
            selector: {
              app: 'mockapp',
            },
          },
        },
      }

      await mockStream.emit('data', JSON.stringify(mockStreamObj))
      const haveTo: Endpoints = {
        mockgqlNamespace:
        [
          { url: 'http://mockName.mockNamespace:9000/graph',
            namespace: 'mockgqlNamespace',
            typePrefix: 'mockgqlNamespace_',
            __imageID: '',
            __deploymentName: 'mockapp',
          },
        ],
      }
      expect(callMockFunc).toBeCalledWith(haveTo)
    })
  })

  describe('tests updateUrl ', () => {
    it('by absolut url', () => {
      const url = 'https://test.de/graphql'
      expect(k8sWatcher.updateUrl(url, {})).toBe(url)
    })
    it('by relativ url', () => {
      const sockData = {
        metadata: {
          name: 'test',
          namespace: 'testNamespace',
        },
      }
      expect(k8sWatcher.updateUrl(':3000/graphql', sockData))
      .toBe('http://test.testNamespace:3000/graphql')
    })
  })

  describe('tests abort', () => {

    it('tests abortServiceForNamespace', () => {
      const serviceAbortMockFunc = jest.fn()
      k8sWatcher.streams = {
        test: {
          service: {
            abort: serviceAbortMockFunc,
          },
        },
      }
      k8sWatcher.abortServicesForNamespace('test')
      expect(serviceAbortMockFunc).toBeCalled()

    })
    it('abortAllStreams', () => {
      const namespaceAbortMockFunc = jest.fn()
      k8sWatcher.namespaceStream = {
        abort: namespaceAbortMockFunc,
      }

      const serviceAbortMockFunc = jest.fn()
      k8sWatcher.streams = {
        one: {
          service: {
            abort: serviceAbortMockFunc,
          },
        },
      }

      k8sWatcher.abortAllStreams()
      expect(namespaceAbortMockFunc).toBeCalled()
      expect(serviceAbortMockFunc).toBeCalled()
    })

  })

  describe('tests __deleteEndpoint', () => {
    it(' delete all', () => {
      k8sWatcher.endpoints = endpoints
      k8sWatcher.deleteEndpoint('swapi', 'swapi')
      expect(k8sWatcher.endpoints).toEqual({})

    })

    it('delete only one ', () => {
      const noDelete = {
        url: 'http://nodelete.default:9002/graphql',
        namespace: 'swapi',
        typePrefix: 'swapi_',
        __imageID: '',
        __deploymentName: 'swapi',
      }
      endpoints.swapi.push(noDelete)
      k8sWatcher.endpoints = endpoints

      k8sWatcher.deleteEndpoint('swapi', 'swapi')
      expect(k8sWatcher.endpoints).toEqual({
        swapi: [noDelete],
      })
    })
  })

})
