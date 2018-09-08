import { sortEndpointAndFindAvailableEndpoints } from '../endpointsAvailable'

import { Endpoints } from '../endpoints'
jest.mock('node-fetch', () => {
  return {
    default: (url) => {
      if (url.startsWith('found')) {
        // found
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => {
            return Promise.resolve({
              found: true,
            })
          },
        })
      }
      return Promise.resolve({
        ok: false,
        status: 200,
        json: () => {
          return Promise.resolve({
            found: false,
          })
        },
      })

    },
  }
})
describe('test endpointsAvailable', () => {
  it('tests that not available endpoints are filtert', async() => {
    const testEndpoints : Endpoints = {
      b: [
        {
          url: 'found',
          namespace: 'mock1',
          typePrefix: '_mock1',
          __imageID: '___',
          __deploymentName: '___',

        },
        {
          url: 'notfound',
          namespace: 'mock1',
          typePrefix: '_mock1',
          __imageID: '___',
          __deploymentName: '___',

        },
      ],
      a: [
        {
          url: 'found',
          namespace: 'mock1',
          typePrefix: '_mock1',
          __imageID: '___',
          __deploymentName: '___',

        },
        {
          url: 'found',
          namespace: 'mock1',
          typePrefix: '_mock1',
          __imageID: '___',
          __deploymentName: '___',

        },
      ],
    }

    const result = await sortEndpointAndFindAvailableEndpoints(testEndpoints)
    expect(result.a.length).toBe(2)
    expect(result.b.length).toBe(1)
    expect(result).toMatchSnapshot()
  })
})
