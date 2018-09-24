import schema, { typeDefs, resolvers } from '../generalSchema'
import { Interpreter } from '../../interpreter/Interpreter'

jest.mock('../../properties', () => {
  return {
    getBuildNumber: () => 'mockBnNumber',
    getVersion: () => 'mockVersion',
    getPollingMs: () => 5000,
  }
})
jest.mock('graphql-tools', () => {
  return {
    makeExecutableSchema: (obj) => {
      return obj
    },
  }
})

describe('tests the adminSchema', () => {
  it('snapshot the typeDefs', () => {

    expect(typeDefs).toMatchSnapshot()// tslint:disable-line
  })

  it('snapshot the resolver function', () => {
    expect(resolvers).toMatchSnapshot()// tslint:disable-line
  })

  it('tests resolver mutation => resetEndpointFinderWatcher', () => {
    const testInterpreter = new class MockInterpreter implements Interpreter{
      testCallFunc = jest.fn()

      resetConnection =  () => {
        this.testCallFunc()
      }
    }
    resolvers.Mutation.resetEndpointFinderWatcher(null, null, {
      interpreter: testInterpreter,
    })

    expect(testInterpreter.testCallFunc).toBeCalled()
  })

  it('tests resolver configuration', () => {
    expect(resolvers.Query.configuration()).toMatchSnapshot// tslint:disable-line
  })

  describe('tests resolver namespaces', () => {
    it('tests struct', () => {
      const inputData = [
        {
          url: 'mockUrl',
          __created: 'mock created',
          __imageID: 'mock image id',
        },
        {
          url: 'mockUrl2',
          __created: 'mock created2',
          __imageID: 'mock image id2',
          __loadbalance: {
            count: 2,
            endpoints: [
              {
                url: 'mockUrl3',
                __created: 'mock create3',
                __imageID: 'mock image id3',
              },
              {
                url: 'mockUrl4',
                __created: 'mock create4',
                __imageID: 'mock image id4',
              },
            ],
          },
        },
      ]
      const endpoints = {
        testNamspace: inputData,
      }
      expect(resolvers.Query.namespaces({}, {}, { endpoints })).toMatchSnapshot()
    })
  })

})
