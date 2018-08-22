//@flow
const Client = require('kubernetes-client').Client
const config = require('kubernetes-client').config
import JSONStream from 'json-stream'
import { getInClusterByUser } from './getInClusterByUser'
import * as clientLabels from '../../finder/clientLabels'
import { allEndpointsAvailable, sortEndpointAndFindAvailableEndpoints } from '../../finder/endpointsAvailable'
import { token, kubernetesConfigurationKind } from '../../properties'
import type { Endpoints } from '../../finder/findEndpointsInterface'
declare function idx(obj: any, callBack: any):any
declare function dataUpdatedListener(data: Endpoints): void
export class K8sWatcher {
  streams = {}
  client = {}
  endpoints : Endpoints = {}
  deploymentsNames = {}
  dataUpdatedListener: dataUpdatedListener
  constructor(){
  }

  setDataUpdatedListener = (listener:dataUpdatedListener) => {
    this.dataUpdatedListener = listener
  }
  __getNamesOfNamespaces = (namespaceListResult: any) => {
    const result = []
    const items = namespaceListResult.body.items
    for (const one in items) {
      const namespaceObj = items[one]
      const k8sNamespace = namespaceObj.metadata.name
      result.push(k8sNamespace)
    }
    return result
  }

  __abortServicesForNamespace = (namespaceName : string) => {
    this.streams[namespaceName].service.abort()
  }

  __abortDeploymentsForNamespace = (namespaceName: string) => {
    this.streams[namespaceName].deployment.abort()
  }

  __watchDeploymentsForNamespace = (namespaceName: string) => {

    //Deployments of Namespace
    const deploymentsStream = this.client.apis.apps.v1beta2.watch.namespaces(namespaceName).deployments.getStream()
    const deploymentsJsonStream = new JSONStream()
    deploymentsStream.pipe(deploymentsJsonStream)
    deploymentsJsonStream.on('data', deployment => {
      const name = idx(deployment, _ => _.object.spec.template.metadata.labels.app) || ''
      if (name == ''){
        if (deployment.status == 'Failure'){
          winston.warn('no Permission for Namspace', namespaceName)
        } else {
          winston.warn('deployment obj is missing attributes ', namespaceName, deployment)
        }
      }
      if (this.deploymentsNames[name] !== undefined){
        for (const one in this.endpoints){
          const oneEndpoint = this.endpoints[one]
          for (let i = 0 ; i < oneEndpoint.length; i++){
            if (oneEndpoint[i].__deploymentName === name){
              switch (deployment.type){
                case 'MODIFIED':
                case 'ADDED': {
                  oneEndpoint[i].__created = deployment.object.metadata.creationTimestamp + ' ' + deployment.object.metadata.resourceVersion
                  this.__callDataUpdateListener()
                  break
                }
                case 'DELETED':{
                  this.__deleteEndpoint(one, name)
                  this.__callDataUpdateListener()
                  break
                }
              }
            }
          }
        }
      }
    })


    this.streams[namespaceName] = {
      deployment: deploymentsStream,
    }


  }

  updateUrl = (url:string, sockData:any) :string => {
    if (url.startsWith('http')){
      return url
    } else {
      return 'http://' + sockData.metadata.name + '.' + sockData.metadata.namespace + url
    }
  }

  __callDataUpdateListener = async() => {
    const realEndpoint = this.endpoints
    for (const one in realEndpoint){
      if (realEndpoint[one].length == 0){
        delete realEndpoint[one]
      }

    }
    const isAllAvailable = await allEndpointsAvailable(realEndpoint)
    if (!isAllAvailable){
      winston.warn('Some endpoints are not available so this will delete from the endpoints', { endpoints: realEndpoint })

      this.dataUpdatedListener(sortEndpointAndFindAvailableEndpoints(realEndpoint))
    } else {
      this.dataUpdatedListener(realEndpoint)
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
  __watchServicesForNamespace = (namespaceName: string) => {


    //Sertvices of Namespace
    const servicesStream = this.client.api.v1.watch.namespaces(namespaceName).services.getStream()
    const servicesJsonStream = new JSONStream()
    servicesStream.pipe(servicesJsonStream)
    servicesJsonStream.on('data', async service => {
      const item = service.object
      switch (service.type){
        case 'MODIFIED':
        case 'ADDED': {
          if (idx(item, _ => _.metadata.annotations[clientLabels.TOKEN]) == token()){
            const url = this.updateUrl(item.metadata.annotations[clientLabels.URL], service.object)
            const namespace = item.metadata.annotations[clientLabels.NAMESPACE]
            const deploymentName = item.spec.selector.app


            const deployments = await this.client.apis.apps.v1beta2.namespaces(namespaceName).deployments.get()
            const compareDeployments = deployments.body.items.filter((one) => {
              return one.spec.template.metadata.labels.app == deploymentName
            })
            this.deploymentsNames[deploymentName] = true
            let __created = ''
            compareDeployments.forEach((one) => {
              __created += one.metadata.creationTimestamp + ' ' + one.metadata.resourceVersion
            })
            this.__deleteEndpoint(namespace, deploymentName)
            if (this.endpoints[namespace] === undefined){
              this.endpoints[namespace] = []
            }
            this.endpoints[namespace].push({
              url,
              namespace,
              typePrefix: namespace + '_',
              __created: __created,
              __imageID: '',
              __deploymentName: deploymentName,
            })
            this.__callDataUpdateListener()

          }
          break
        }
        case 'DELETED': {
          if (idx(item, _ => _.metadata.annotations[clientLabels.TOKEN]) == token()){
            const namespace = item.metadata.annotations[clientLabels.NAMESPACE]
            const deploymentName = item.spec.selector.app
            winston.debug('delete service', namespace, deploymentName)
            this.__deleteEndpoint(namespace, deploymentName)
            winston.debug('delete service no data', this.endpoints)
            this.__callDataUpdateListener()

          }
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
      case 'getInClusterByUser':{
        winston.info('Load getIntClusterByUser')
        this.client = new Client({ config: getInClusterByUser() })
      }
    }
    await this.client.loadSpec()
    try {
      const namespaceStream = this.client.api.v1.watch.namespaces.getStream()
      const namespaceJsonStream = new JSONStream()
      namespaceStream.pipe(namespaceJsonStream)
      namespaceJsonStream.on('data', object => {
        const name = object.object.metadata.name
        switch (object.type){
          case 'ADDED': {
            this.__watchServicesForNamespace(name)
            this.__watchDeploymentsForNamespace(name)
            break
          }
          case 'DELETED': {
            this.__abortServicesForNamespace(name)
            this.__abortDeploymentsForNamespace(name)
            break

          }
        }
      })
    } catch (err){
      winston.error('Error by watchEndpoints', err)
    }

  }

}
