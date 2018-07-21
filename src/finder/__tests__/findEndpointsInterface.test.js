import { FindEndpoints } from '../findEndpointsInterface'

describe('tests the parentFinderClass', () => {
  let findendpoints = null
  beforeEach(() => {
    findendpoints = new FindEndpoints()
  })

  it('tests that handleRestart retrun the input', () => {
    expect(findendpoints.handleRestart('input')).toBe('input')
  })

  it ('tests getEndpoints return a empty obj', () => {
    expect(findendpoints.getEndpoints()).toEqual({})
  })
})
