const Client = require('kubernetes-client').Client
const config = require('kubernetes-client').config

import * as JSONStream from 'json-stream'
import { WatcherInterface } from '../WatcherInterface'
import { getInClusterByUser } from './getInClusterByUser'
import * as clientLabels from '../../clientLabels'
import { token, kubernetesConfigurationKind } from '../../../properties'
type stream = {
  service: any,
}

type streams = {
  [index:string]: stream,
}
export class K8sWatcher extends WatcherInterface{
  namespaceStream: any = {}
  streams: streams = {}
  client: any = {}
  constructor() {
    super()

  }
  abortAllStreams = () => {
    this.namespaceStream.abort()
    for (const one in this.streams) {
      const oneStream = this.streams[one]
      idx(oneStream, _ => _.service.abort())
    }

  }

  abortServicesForNamespace = (namespaceName : string) => {
    this.streams[namespaceName].service.abort()
  }

  updateUrl = (url:string, sockData:any) :string => {
    if (url.startsWith('http')) {
      return url
    }
    return 'http://' + sockData.metadata.name + '.' + sockData.metadata.namespace + url

  }

  watchServicesForNamespace = (namespaceName: string) => {

    // Sertvices of Namespace
    const servicesStream = this.client.api.v1.watch.namespaces(namespaceName).services.getStream()
    const servicesJsonStream = new JSONStream()
    servicesStream.pipe(servicesJsonStream)
    servicesJsonStream.on('error', (err) => {
      winston.warn('error by service Stream', err)
    })

    servicesJsonStream.on('data', async (service) => {

      const item = service.object
      switch (service.type){
        case 'MODIFIED':
        case 'ADDED': {
          if (idx(item, _ => _.metadata.annotations[clientLabels.TOKEN]) + '' === token()) {
            const url = this.updateUrl(item.metadata.annotations[clientLabels.URL], service.object)
            const namespace = item.metadata.annotations[clientLabels.NAMESPACE]
            const deploymentName = item.spec.selector.app
            winston.debug('stream send new namespaces for:' + deploymentName, { service })

            // const deployments = await this.client.apis.apps.v1beta2
            //                     .namespaces(namespaceName).deployments.get();
            // deployments.body.items.filter((one) => {
            //   return one.spec.template.metadata.labels.app === deploymentName;
            // });

            this.deleteEndpoint(namespace, deploymentName)
            if (this.endpoints[namespace] === undefined) {
              this.endpoints[namespace] = []
            }
            this.endpoints[namespace].push({
              url,
              namespace,
              typePrefix: namespace + '_',
              __imageID: '',
              __deploymentName: deploymentName,
            })
            this.callDataUpdateListener()

          }
          break
        }
        case 'DELETED': {
          if (idx(item, _ => _.metadata.annotations[clientLabels.TOKEN]) === token()) {
            const namespace = item.metadata.annotations[clientLabels.NAMESPACE]
            const deploymentName = item.spec.selector.app
            winston.debug('delete service', namespace, deploymentName)
            this.deleteEndpoint(namespace, deploymentName)
            winston.debug('delete service no data', this.endpoints)
            this.callDataUpdateListener()

          }
          break
        }
        default: {
          winston.debug('un used event', service.type)
          break
        }
      }
    })

    this.streams[namespaceName] = {
      service: servicesStream,
    }

  }

  watchEndpoint = async() => {
    winston.info('Load K8s')
    switch (kubernetesConfigurationKind()){
      case 'fromKubeconfig': {
        winston.info('Load fromKubeconfig')
        this.client = new Client({ config: config.fromKubeconfig() })
        break
      }
      case 'getInCluster': {
        winston.info('Load getInCluster')
        this.client = new Client({ config: config.getInCluster() })
        break
      }
      case 'getInClusterByUser': {
        winston.info('Load getIntClusterByUser')
        this.client = new Client({ config: getInClusterByUser() })
      }
    }
    await this.client.loadSpec()
    try {
      const namespaceStream = this.client.api.v1.watch.namespaces.getStream()
      const namespaceJsonStream = new JSONStream()
      namespaceStream.pipe(namespaceJsonStream)
      namespaceJsonStream.on('error', (err) => {
        winston.warn('error by namespaceStream', err)
      })
      namespaceJsonStream.on('data', (object) => {
        const name = object.object.metadata.name
        switch (object.type){
          case 'ADDED': {
            this.watchServicesForNamespace(name)
            break
          }
          case 'DELETED': {
            this.abortServicesForNamespace(name)
            break

          }
          default: {
            winston.debug('un used event', object.type)
            break
          }
        }
      })
      this.namespaceStream = namespaceStream
    } catch (err) {
      winston.error('Error by watchEndpoints', err)
    }

  }

}
