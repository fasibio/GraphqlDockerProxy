
//@flow
const Client = require('kubernetes-client').Client
const config = require('kubernetes-client').config
import * as clientLabels from '../clientLabels'
import { FindEndpoints } from '../findEndpointsInterface'
import { token, kubernetesConfigurationKind } from '../../properties'
import type { Endpoints } from '../findEndpointsInterface'
import { getInClusterByUser } from './getInClusterByUser'
declare function idx(obj: any, callBack: any):any

export class K8sFinder extends FindEndpoints{
  constructor(){
    super()
  }

  updateUrl = (url:string, sockData:any) :string => {
    if (url.startsWith('http')){
      return url
    } else {
      return 'http://' + sockData.metadata.name + '.' + sockData.metadata.namespace + url
    }
  }


  getEndpoints = async(): Endpoints => {
    const result = {}
    let client : any = {}
    console.log('Load K8s')
    switch (kubernetesConfigurationKind()){
      case 'fromKubeconfig': {
        console.log('Load fromKubeconfig')
        client = new Client({ config: config.fromKubeconfig() })
        break
      }
      case 'getInCluster': {
        console.log('Load getInCluster:', config.getInCluster())
        client = new Client({ config: config.getInCluster() })
        break
      }
      case 'getInClusterByUser':{
        console.log('Load getIntClusterByUser:', getInClusterByUser())
        client = new Client({ config: getInClusterByUser() })
      }
    }
    await client.loadSpec()
    // const namespaces = await client.api.v1.namespaces.get()
    // console.log())

    const deployments = await client.api.extension.v1beta1.deployments.get()

    const services = await client.api.v1.services.get()//client.api.v1.services.get()
    services.body.items.forEach((one) => {
      if (idx(one, _ => _.metadata.annotations[clientLabels.TOKEN]) == token()){
        const url = this.updateUrl(one.metadata.annotations[clientLabels.URL], one)
        const namespace = one.metadata.annotations[clientLabels.NAMESPACE]
        if (result[namespace] == undefined){
          result[namespace] = []
        }
        const deploymentName = one.spec.selector.app

        const compareDeployments = deployments.body.items.filter((one) => {
          return one.spec.template.metadata.labels.app == deploymentName
        })
        let __created = ''
        compareDeployments.forEach((one) => {
          __created += one.metadata.creationTimestamp
        })
        result[namespace].push({
          url,
          namespace,
          typePrefix: namespace + '_',
          __created: __created,
          __imageID: '',
        })

      }

    })
    return result
  }
}

