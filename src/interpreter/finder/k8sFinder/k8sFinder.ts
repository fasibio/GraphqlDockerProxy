
const Client = require('kubernetes-client').Client
const config = require('kubernetes-client').config
import * as clientLabels from '../../clientLabels'
import { FindEndpoints } from '../findEndpointsInterface'
import { Endpoints } from '../../endpoints'
import { token, kubernetesConfigurationKind } from '../../../properties'
import { getInClusterByUser } from './getInClusterByUser'
import { addNamespaceToBlacklist, isNamespaceAtBlacklist } from './blacklist'
declare function idx(obj: any, callBack: any):any

export class K8sFinder extends FindEndpoints{
  constructor() {
    super()
  }

  updateUrl = (url:string, sockData:any) :string => {
    if (url.startsWith('http')) {
      return url
    }
    return 'http://' + sockData.metadata.name + '.' + sockData.metadata.namespace + url

  }

  getEndpoints = async(): Promise<Endpoints> => {
    const result = {}
    let client : any = {}
    winston.info('Load K8s')
    switch (kubernetesConfigurationKind()){
      case 'fromKubeconfig': {
        winston.info('Load fromKubeconfig')
        client = new Client({ config: config.fromKubeconfig() })
        break
      }
      case 'getInCluster': {
        winston.info('Load getInCluster')
        client = new Client({ config: config.getInCluster() })
        break
      }
      case 'getInClusterByUser': {
        winston.info('Load getIntClusterByUser')
        client = new Client({ config: getInClusterByUser() })
      }
    }
    await client.loadSpec()
    // const namespaces = await client.api.v1.namespaces.get()
    // console.log())
    const allNamespaces = await client.api.v1.namespaces.get()
    const items = allNamespaces.body.items
    for (const one in items) {
      const namespaceObj = items[one]
      const k8sNamespace = namespaceObj.metadata.name
      if (isNamespaceAtBlacklist(k8sNamespace)) {
        continue
      }
      // const services = client.api.v1.namespaces(namespace).services.get()
      try {
        const services = await client.api.v1.namespaces(k8sNamespace).services.get()
        const servicesItems = services.body.items
        for (const oneService in servicesItems) {
          const oneServiceItem = servicesItems[oneService]
          if (idx(oneServiceItem, _ => _.metadata.annotations[clientLabels.TOKEN]) === token()) {
            const url = this.updateUrl(oneServiceItem.metadata.annotations[clientLabels.URL],
                                       oneServiceItem)
            const namespace = oneServiceItem.metadata.annotations[clientLabels.NAMESPACE]
            if (result[namespace] === undefined) {
              result[namespace] = []
            }
            const deploymentName = oneServiceItem.spec.selector.app
            const deployments = await client.apis.apps.v1beta2.namespaces(k8sNamespace)
                                .deployments.get()
            const compareDeployments = deployments.body.items.filter((one) => {
              return one.spec.template.metadata.labels.app === deploymentName
            })
            let created = ''
            compareDeployments.forEach((one) => {
              created += one.metadata.creationTimestamp
            })
            result[namespace].push({
              url,
              namespace,
              typePrefix: namespace + '_',
              __created: created,
              __imageID: '',
            })
          }
        }
      } catch (e) {
        addNamespaceToBlacklist(k8sNamespace)
        // no loging because user have no permission
        // console.log('error by reading namespace:' + k8sNamespace + ' ', e)
      }

    }
    return result
  }
}
