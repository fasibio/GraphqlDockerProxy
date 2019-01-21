import { runtime, getPollingMs, getResetEndpointTime } from './properties'
import { Endpoints } from './interpreter/endpoints'
import { Interpreter } from './interpreter/Interpreter'
import { K8sFinder } from './interpreter/finder/k8sFinder/k8sFinder'
import { DockerFinder } from './interpreter/finder/dockerFinder/dockerFinder'
import { K8sWatcher } from './interpreter/watcher/k8s/K8sWatcher'
import { DockerWatcher } from './interpreter/watcher/docker/DockerWatcher'
type callBackPara = {
  handleRestart :(endpoints:Endpoints) => Promise<Endpoints>,
  interpreter: Interpreter,
  foundedEndpoints: Endpoints,
}

type callBack = (callBackPara: callBackPara) => void

export const loadRuntimeInfo = (callBack: callBack) => {
  switch (runtime()){
    case 'kubernetes': {
      const k8sFinder = new K8sFinder()
      setInterval(async() => {
        callBack({
          foundedEndpoints: await k8sFinder.getEndpoints(),
          handleRestart: k8sFinder.handleRestart,
          interpreter: k8sFinder,
        })
      },          getPollingMs())
      break
    }
    case 'docker': {
      const dockerFinder = new DockerFinder()
      setInterval(async() => {
        callBack({
          foundedEndpoints: await dockerFinder.getEndpoints(),
          handleRestart: dockerFinder.handleRestart,
          interpreter: dockerFinder,
        })
      },          getPollingMs())
      break
    }

    case 'kubernetesWatch': {
      const watcher = new K8sWatcher()
      watcher.setDataUpdatedListener((endpoints) => {
        winston.info('Watcher called new endpoints ', { endpoints })
        callBack({
          foundedEndpoints: endpoints,
          handleRestart: watcher.handleRestart,
          interpreter: watcher,
        })
      })
      watcher.watchEndpoint()
      setInterval(() => {
        winston.info('Reset Watching from K8S endpoints (work a around)')
        watcher.abortAllStreams()
        watcher.watchEndpoint()
      },          getResetEndpointTime())
      break
    }
    case 'dockerWatch': {
      const dockerWatcher = new DockerWatcher()
      dockerWatcher.watchEndpoint()
      dockerWatcher.setDataUpdatedListener((endpoints) => {
        winston.info('Watcher called new endpoints ')
        callBack({
          foundedEndpoints: endpoints,
          handleRestart: dockerWatcher.handleRestart,
          interpreter: dockerWatcher,
        })
      })
      setInterval(() => {
        winston.info('Reset Watching from endpoints (work a around)')
        dockerWatcher.abortAllStreams()
        dockerWatcher.watchEndpoint()
      },          getResetEndpointTime())
    }

  }
}
