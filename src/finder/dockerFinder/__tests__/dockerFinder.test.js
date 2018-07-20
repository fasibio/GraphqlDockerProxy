import { DockerFinder } from '../dockerFinder'
jest.mock('../../endpointsAvailable', () => {
  return {
    sortEndpointAndFindAvailableEndpoints: (data) => {
      return Promise.resolve(data)
    },
  }
})
jest.mock('../../../properties', () => {
  return {
    token: () => {
      return '1234'
    },
    network: () => {
      return 'web'
    },
  }
})
jest.mock('node-docker-api')
describe('Tests the docḱerfinder Class', () => {
  let dockerFinder = null
  beforeEach(() => {
    dockerFinder = new DockerFinder()
  })

  describe('tests method getEndpoints', () => {
    it('gives a list of object and filter the right endpoints', async() => {
      const endpoints = await dockerFinder.getEndpoints()
      expect(endpoints).toMatchSnapshot()
    })
  })

  describe('tests handleRestart', () => {
    it ('tests there does not need loadbalance no change at endpoints ', async() => {
      const endpoints = await dockerFinder.getEndpoints()
      const newEndpoints = await dockerFinder.handleRestart(endpoints)
      expect(endpoints).toEqual(newEndpoints)
    })


  })
})
