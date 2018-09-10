import { loadRuntimeInfo } from '../runtimeIni'
import { Endpoints } from '../interpreter/endpoints'
jest.useFakeTimers()

jest.mock('../interpreter/watcher/docker/DockerWatcher', () => {
  return {
    DockerWatcher: class K8sWatcherMock{
      setDataUpdatedListener(callBack) {

        const result: Endpoints = {
          a: [
            {
              url: 'mock',
              typePrefix: '_mock',
              namespace: 'mock',
              __deploymentName: 'mock',
              __imageID: 'mock',
            },
          ],
        }
        callBack(result)
      }
      handleRestart() {
        return {}
      }
      watchEndpoint() {

      }
    },
  }
})
jest.mock('../interpreter/watcher/k8s/K8sWatcher', () => {
  return {
    K8sWatcher: class K8sWatcherMock{
      setDataUpdatedListener(callBack) {

        const result: Endpoints = {
          a: [
            {
              url: 'mock',
              typePrefix: '_mock',
              namespace: 'mock',
              __deploymentName: 'mock',
              __imageID: 'mock',
            },
          ],
        }
        callBack(result)
      }
      handleRestart() {
        return {}
      }
      watchEndpoint() {

      }
    },
  }
})
jest.mock('../interpreter/finder/dockerFinder/dockerFinder', () => {
  return {
    DockerFinder: class DockerFinderMock{
      getEndpoints() {
        const result: Endpoints = {
          a: [
            {
              url: 'mock',
              typePrefix: '_mock',
              namespace: 'mock',
              __deploymentName: 'mock',
              __imageID: 'mock',
            },
          ],
        }
        return Promise.resolve(result)
      }
      handleRestart() {
        return {}
      }
    },
  }
})
jest.mock('../interpreter/finder/k8sFinder/k8sFinder', () => {
  return {
    K8sFinder: class K8sFinderMock{
      getEndpoints() {
        const result: Endpoints = {
          a: [
            {
              url: 'mock',
              typePrefix: '_mock',
              namespace: 'mock',
              __deploymentName: 'mock',
              __imageID: 'mock',
            },
          ],
        }
        return Promise.resolve(result)
      }
      handleRestart() {
        return {}
      }
    },
  }
})

describe('tests the runtimeini', () => {

  const runtime = [
    'kubernetes',
    'docker',
    // 'kubernetesWatch',
    // 'dockerWatch',
  ]

  it('tests loadRuntime by runtime: kubernetes', () => {
    expect.assertions(5)
    const callBack = (obj) => {
      expect(obj).toMatchSnapshot()
    }
    process.env.qglProxyRuntime = 'kubernetes'
    loadRuntimeInfo(callBack)
    jest.runOnlyPendingTimers()
    process.env.qglProxyRuntime = 'docker'
    loadRuntimeInfo(callBack)
    jest.runOnlyPendingTimers()
    process.env.qglProxyRuntime = 'kubernetesWatch'
    loadRuntimeInfo(callBack)
    process.env.qglProxyRuntime = 'dockerWatch'
    loadRuntimeInfo(callBack)

  })

})
