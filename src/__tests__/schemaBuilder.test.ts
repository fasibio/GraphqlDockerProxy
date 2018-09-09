import { createRemoteSchema, getMergedInformation } from '../schemaBuilder'
import { Endpoints } from '../interpreter/endpoints'
jest.mock('graphql-tools', () => {
  return {
    introspectSchema: (link) => {
      return Promise.resolve(link)
    },

    makeRemoteExecutableSchema: (obj) => {
      return obj
    },
    mergeSchemas: (obj) => {
      return obj
    },
  }
})

jest.mock('apollo-link-context', () => {
  return {
    setContext: () => {
      return {
        concat: (link) => {
          return link
        },
      }
    },
  }
})
jest.mock('apollo-link-http', () => {
  return {
    HttpLink: class {
      uri: string
      constructor({ uri }) {
        this.uri = uri
      }
    },
  }
})

describe('test schemabuilder', () => {
  it('tests createRemoteSchema', async() => {
    expect(await createRemoteSchema('mock')).toMatchSnapshot()
  })

  it('tests getMergedInformation', async() => {
    const endpoints: Endpoints = {
      a: [
        {
          url: 'mock',
          namespace: 'mock',
          __deploymentName: '---',
          __imageID: '---',
          typePrefix: '_mock',
        },
      ],
    }

    expect(await getMergedInformation(endpoints.a)).toMatchSnapshot()
  })
})
