import { WatcherInterface } from '../WatcherInterface'

describe('Test the WatcherInterface', () => {
  let watcher : WatcherInterface = null
  beforeEach(() => {
    watcher = new WatcherInterface()
  })
  it('snapshot all methodes and const', () => {
    for (const one in watcher) {
      expect(one).toMatchSnapshot()
    }
  })

  it('test call watch and abort Stream', () => {
    watcher.watchEndpoint = jest.fn()
    watcher.abortAllStreams = jest.fn()
    watcher.resetConnection()

    expect(watcher.watchEndpoint).toBeCalled()
    expect(watcher.abortAllStreams).toBeCalled()
  })

  it('test deleteEndpoint do the right job', () => {
    const wa = {
      a: [
        {
          url: 'mock',
          namespace:'mock',
          typePrefix: '_mock',
          __deploymentName: 'mock',
          __imageID: 'mock',

        },
        {
          url: 'mock',
          namespace:'mock',
          typePrefix: '_mock',
          __deploymentName: 'delete',
          __imageID: 'mock',
        },
      ],
    }
    watcher.endpoints = wa
    watcher.deleteEndpoint('a', 'delete')
    expect(watcher.endpoints.a.length).toBe(1)
  })

  it('test callDataUpdateListener', async() => {
    const wa = {
      a: [
        {
          url: 'mock',
          namespace:'mock',
          typePrefix: '_mock',
          __deploymentName: 'mock',
          __imageID: 'mock',

        },
      ],
    }
    watcher.endpoints = wa
    const listener = jest.fn()
    watcher.setDataUpdatedListener(listener)
    await watcher.callDataUpdateListener()
    expect(listener).toBeCalledWith(wa)
  })
})
