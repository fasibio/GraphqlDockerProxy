import { DockerFinder } from '../dockerFinder'
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
})
