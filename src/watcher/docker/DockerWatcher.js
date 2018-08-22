//@flow

import type { Endpoints } from '../../finder/findEndpointsInterface'
import cloner from 'cloner'
import * as clientLabels from '../../finder/clientLabels'
import { token, network } from '../../properties'

import monitor from 'node-docker-monitor'
declare function dataUpdatedListener(data: Endpoints): void
declare function idx(obj: any, callBack: any):any

export class DockerWatcher{
  endpoints : Endpoints = {}
  dataUpdatedListener: dataUpdatedListener = () => {}

  constructor(){}
  __callDataUpdateListener = async() => {
    const realEndpoint = cloner.deep.copy(this.endpoints)
    for (const one in realEndpoint){
      if (realEndpoint[one].length == 0){
        delete realEndpoint[one]
      }

    }
    console.log(realEndpoint)
    this.dataUpdatedListener(realEndpoint)

  }


  /**
 * Schaut ob es sich um eine absolute url handelt.(Startet mit http(s)://)
 * Wenn nicht sucht sie die ip des netzwerkes raus. (Relative URL z.B.: :{port}{suburl}(:3001/graphql))
 *
 *
 */
 updateUrl = (url:string, sockData:any) :string => {
   if (url.startsWith('http')){
     return url
   } else {
     return 'http://' + sockData.NetworkSettings.Networks[network()].IPAddress + url
   }
 }

 __deleteEndpoint = (namespace: string, deploymentName: string) => {
   if (this.endpoints[namespace] == undefined){
     return
   }
   for (let i = 0 ; i < this.endpoints[namespace].length; i++){
     if (this.endpoints[namespace][i].__deploymentName == deploymentName){
       this.endpoints[namespace].splice(i, 1)
     }
   }
   if (this.endpoints[namespace].length === 0){
     delete this.endpoints[namespace]
   }
 }

  __onContainerUp = (container: any) => {
    if (container.Labels[clientLabels.TOKEN] == token()){
      const url = container.Labels[clientLabels.URL]
      const namespace = container.Labels[clientLabels.NAMESPACE]
      const deploymentName = container.Id
      this.__deleteEndpoint(namespace, deploymentName)

      if (this.endpoints[namespace] == undefined){
        this.endpoints[namespace] = []
      }
      // $FlowFixMe: suppressing this error until we can refactor
      this.endpoints[namespace].push({
        url: this.updateUrl(url, container),
        namespace,
        typePrefix: namespace + '_',
        __created: container.Created,
        __imageID: container.Image,
        __deploymentName: deploymentName,
      })
      this.__callDataUpdateListener()
    }
  }

  __onContainerDown = (container) => {}
  watchEndpoint = () => {
    monitor({
      onContainerUp: this.__onContainerUp,

      onContainerDown: this.__onContainerDown,
    })
  }
}
