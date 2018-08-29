
import * as clientLabels from '../../clientLabels'
import { token, network } from '../../../properties'
import { WatcherInterface } from '../WatcherInterface'
import * as monitor from 'node-docker-monitor'
import { Endpoints } from '../../endpoints'
import { foundEquals } from '../../loadBalancer'
export class DockerWatcher extends WatcherInterface{

  constructor() {
    super()
  }

  /**
 * Schaut ob es sich um eine absolute url handelt.(Startet mit http(s)://)
 * Wenn nicht sucht sie die ip des netzwerkes raus.
 * (Relative URL z.B.: :{port}{suburl}(:3001/graphql))
 */
  updateUrl = (url:string, sockData:any) :string => {
    if (url.startsWith('http')) {
      return url
    }
    return 'http://' + sockData.NetworkSettings.Networks[network()].IPAddress + url

  }

  onContainerUp = (container: any) => {
    if (container.Labels[clientLabels.TOKEN] === token()) {
      console.log('onContainerUp')
      const namespace :string = container.Labels[clientLabels.NAMESPACE]

      const deploymentName = container.Id
      const url = this.updateUrl(container.Labels[clientLabels.URL], container)
      this.deleteEndpoint(namespace, deploymentName)

      if (this.endpoints[namespace] === undefined) {
        this.endpoints[namespace] = []
      }
      this.endpoints[namespace].push({
        namespace,
        url,
        typePrefix: namespace + '_',
        __imageID: container.Image,
        __deploymentName: deploymentName,
      })
      this.callDataUpdateListener()
    }
  }

  handleRestart = async(datas:Endpoints) : Promise<Endpoints> => {
    return await foundEquals(datas)
  }

  onContainerDown = (container) => {
    if (container.Labels[clientLabels.TOKEN] === token()) {
      const deploymentName = container.Id
      for (const one in this.endpoints) {
        const oneNamespace = this.endpoints[one]
        for (let i = 0 ; i < oneNamespace.length; i = i + 1) {
          const oneEndpoint = oneNamespace[i]
          if (oneEndpoint.__deploymentName === deploymentName) {
            this.deleteEndpoint(container.Labels[clientLabels.NAMESPACE], deploymentName)
          }
        }

      }
      this.callDataUpdateListener()
    }
  }
  watchEndpoint = () => {

    monitor({
      onMonitorStarted: () => { },
      onMonitorStopped: () => {},
      onContainerUp: this.onContainerUp,
      onContainerDown: this.onContainerDown,
    })
  }
}
