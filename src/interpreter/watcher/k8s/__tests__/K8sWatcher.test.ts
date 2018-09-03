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

describe('tests the K8sWatcher', () => {

  let k8sWatcher = null
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

  describe('tests the updatelistener is Called by deployment stream', () => {
    let mockedStream = null
    beforeEach(() => {
      mockedStream = new Readable()
      k8sWatcher.client = {
        apis: {
          apps: {
            v1beta2: {
              watch: {
                namespaces: () => {
                  return {
                    deployments: {
                      getStream: () => {
                        mockedStream._read = function () { /* do nothing */ }
                        return mockedStream
                      },
                    },
                  }
                },
              },
            },
          },
        },
      }
      k8sWatcher.endpoints = endpoints
    })

    it('by ADDING deyployment', async() => {
      expect.assertions(1)
      const callMockFunc = jest.fn()
      k8sWatcher.setDataUpdatedListener(callMockFunc)
      k8sWatcher.deploymentsNames = {
        swapi: true,
      }
      k8sWatcher.watchDeploymentsForNamespace('mock')
      const mockStreamObj = {
        type: 'ADDED',
        object: {
          metadata: {
            creationTimestamp: 'mock',
            resourceVersion: 'mock',
          },
          spec: {
            template: {
              metadata: {
                labels: {
                  app: 'swapi',

                },
              },
            },
          },
        },
      }
      await mockedStream.emit('data', JSON.stringify(mockStreamObj))
      const haveTo: Endpoints = {
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
      expect(callMockFunc).toBeCalledWith(haveTo)
    })

    it('by MODIFIED deyployment', async() => {
      expect.assertions(1)

      const callMockFunc = jest.fn()
      k8sWatcher.setDataUpdatedListener(callMockFunc)
      k8sWatcher.deploymentsNames = {
        swapi: true,
      }
      k8sWatcher.watchDeploymentsForNamespace('mock')
      const mockStreamObj = {
        type: 'MODIFIED',
        object: {
          metadata: {
            creationTimestamp: 'mock',
            resourceVersion: 'mock',
          },
          spec: {
            template: {
              metadata: {
                labels: {
                  app: 'swapi',

                },
              },
            },
          },
        },
      }
      await mockedStream.emit('data', JSON.stringify(mockStreamObj))

      const haveTo: Endpoints = {
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
      expect(callMockFunc).toBeCalledWith(haveTo)
    })

    xit('by DELETED deyployment', async() => {
      expect.assertions(1)

      const callMockFunc = jest.fn()
      k8sWatcher.setDataUpdatedListener(callMockFunc)
      k8sWatcher.deploymentsNames = {
        swapi: true,
      }
      k8sWatcher.watchDeploymentsForNamespace('mock')
      const mockStreamObj = {
        type: 'DELETED',
        object: {
          metadata: {
            creationTimestamp: 'mock',
            resourceVersion: 'mock',
          },
          spec: {
            template: {
              metadata: {
                labels: {
                  app: 'swapi',

                },
              },
            },
          },
        },
      }
      await mockedStream.emit('data', JSON.stringify(mockStreamObj))

      expect(callMockFunc).toBeCalledWith({})
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
