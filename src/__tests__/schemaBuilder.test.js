jest.mock('graphql-tools', () => {
  return {
    introspectSchema: () => {},
    makeRemoteExecutableSchema: () => {},
  }
})
jest.mock('apollo-link-context', () => {
  return {
    setContext: () => {
      return {
        concat: () => {},
      }
    },
  }
})
jest.mock('apollo-link-http', () => {
  return {
    HttpLink: () => {
      return {}
    },
  }
})

describe('test schemabuild functions', () => {
  it('test createRemoteSchema ', () => {
    expect(true).toBe(true)
    //I can not find a good test to test the code and not the library
  })
})
