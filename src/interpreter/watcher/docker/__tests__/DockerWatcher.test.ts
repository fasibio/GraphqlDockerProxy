import { DockerWatcher } from '../DockerWatcher'

jest.mock('../../../../properties', () => {
  return {
    token: () => '123',
    network: () => 'web',
  }
})
describe('test the DockerWatcher', () => {

  let watcher : DockerWatcher = null
  beforeEach(() => {
    watcher = new DockerWatcher()
  })

  describe('tests onContainerUp', () => {

    it('tests by container with gql label token', () => {
      const exampleContainer = {        NetworkSettings: {
        Networks: {
          web: {
            IPAddress: '127.0.0.1',
          },
        },
      },

        Labels: {
          'gqlProxy.token': '123',
          'gqlProxy.url': ':mock:9000',
          'gqlProxy.namespace': 'a',
        },
      }
      watcher.callDataUpdateListener = jest.fn()
      watcher.onContainerUp(exampleContainer)
      expect(watcher.callDataUpdateListener).toBeCalled()
      expect(watcher.endpoints).toMatchSnapshot()

    })

    it('tests by container with no gql label token', () => {
      const exampleContainer = {
        Labels: {

        },
      }
      watcher.callDataUpdateListener = jest.fn()
      watcher.onContainerUp(exampleContainer)
      expect(watcher.callDataUpdateListener).not.toBeCalled()

    })
  })

  describe('tests updateUrl', () => {
    it('do the job by absolute url', () => {
      const url = 'http://test.de/graphql'
      expect(watcher.updateUrl(url, {})).toEqual(url)

    })

    it('do the job by relative path', () => {
      const url = ':9000/graphql'
      const result = watcher.updateUrl(url, {
        NetworkSettings: {
          Networks: {
            web: {
              IPAddress: '127.0.0.1',
            },
          },
        },
      })

      expect(result).toEqual('http://127.0.0.1:9000/graphql')
    })
  })

})
