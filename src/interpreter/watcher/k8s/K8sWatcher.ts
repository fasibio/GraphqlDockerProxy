// @flow
const Client = require('kubernetes-client').Client;
const config = require('kubernetes-client').config;

import * as JSONStream from 'json-stream';
import { WatcherInterface } from '../WatcherInterface';
import { getInClusterByUser } from './getInClusterByUser';
import * as clientLabels from '../../clientLabels';
import { token, kubernetesConfigurationKind } from '../../../properties';
declare function idx(obj: any, callBack: any):any;
export class K8sWatcher extends WatcherInterface{
  streams = {};
  client: any = {};
  deploymentsNames = {};
  constructor() {
    super();

  }

  abortServicesForNamespace = (namespaceName : string) => {
    this.streams[namespaceName].service.abort();
  }

  abortDeploymentsForNamespace = (namespaceName: string) => {
    this.streams[namespaceName].deployment.abort();
  }

  abortPodsForNamespace = (namespaceName: string) => {
    this.streams[namespaceName].pods.abort();
  }

  watchPodsForNamespace = (namespaceName: string) => {
    const podsStream = this.client.api.v1.watch.namespaces(namespaceName).pods.getStream();
    const podsJSONStream = new JSONStream();
    podsStream.pipe(podsJSONStream);

    podsJSONStream.on('data', (pods) => {
      const deploymentName = idx(pods, _ => _.object.metadata.labels.app) || '';
      if (deploymentName === '') {
        if (pods.status === 'Failure') {
          winston.warn('no Permission for Namspace ' + namespaceName);
        } else {
          winston.warn('pod obj is missing object.metadata.labels.app will be ignored');
        }
      }
      if (this.deploymentsNames[deploymentName] !== undefined) {
        winston.debug('stream send new pods for: ' + deploymentName);
        for (const one in this.endpoints) {
          const oneEndpoint = this.endpoints[one];
          for (let i = 0 ; i < oneEndpoint.length; i = i + 1) {

            if (oneEndpoint[i].__deploymentName === deploymentName) {
              switch (pods.type){
                case 'MODIFIED':
                case 'ADDED': {
                  oneEndpoint[i].__created = oneEndpoint[i].__created +
                   pods.object.metadata.creationTimestamp + ' '
                   + pods.object.metadata.resourceVersion;
                  this.callDataUpdateListener();
                  break;
                }
                case 'DELETED': {
                  this.deleteEndpoint(one, deploymentName);
                  this.callDataUpdateListener();
                  break;
                }
              }
            }
          }
        }
      }
    });
    this.streams[namespaceName] = {
      pods: podsStream,
    };

  }

  watchDeploymentsForNamespace = (namespaceName: string) => {

    // Deployments of Namespace
    const deploymentsStream = this.client.apis.apps.v1beta2.watch
                              .namespaces(namespaceName).deployments.getStream();
    const deploymentsJsonStream = new JSONStream();
    deploymentsStream.pipe(deploymentsJsonStream);
    deploymentsJsonStream.on('data', async(deployment) => {

      const name = idx(deployment, _ => _.object.spec.template.metadata.labels.app) || '';
      if (name === '') {
        if (deployment.status === 'Failure') {
          winston.info('no Permission for Namspace' + namespaceName);
        } else {
          winston.info('deployment obj is missing attributes. missing labels app. will be ignored');
        }
      }
      if (this.deploymentsNames[name] !== undefined) {
        winston.debug('stream send new deployments for: ' + name);
        for (const one in this.endpoints) {
          const oneEndpoint = this.endpoints[one];
          for (let i = 0 ; i < oneEndpoint.length; i = i + 1) {

            if (oneEndpoint[i].__deploymentName === name) {
              switch (deployment.type){
                case 'MODIFIED':
                case 'ADDED': {
                  oneEndpoint[i].__created = deployment.object.metadata.creationTimestamp
                  + ' ' + deployment.object.metadata.resourceVersion;
                  await this.callDataUpdateListener();
                  break;
                }
                case 'DELETED': {
                  this.deleteEndpoint(one, name);
                  this.callDataUpdateListener();
                  break;
                }
              }
            }
          }
        }
      }
    });

    this.streams[namespaceName] = {
      deployment: deploymentsStream,
    };

  }

  updateUrl = (url:string, sockData:any) :string => {
    if (url.startsWith('http')) {
      return url;
    }
    return 'http://' + sockData.metadata.name + '.' + sockData.metadata.namespace + url;

  }

  watchServicesForNamespace = (namespaceName: string) => {

    // Sertvices of Namespace
    const servicesStream = this.client.api.v1.watch.namespaces(namespaceName).services.getStream();
    const servicesJsonStream = new JSONStream();
    servicesStream.pipe(servicesJsonStream);
    servicesJsonStream.on('data', async (service) => {

      const item = service.object;
      switch (service.type){
        case 'MODIFIED':
        case 'ADDED': {
          if (idx(item, _ => _.metadata.annotations[clientLabels.TOKEN]) + '' === token()) {
            const url = this.updateUrl(item.metadata.annotations[clientLabels.URL], service.object);
            const namespace = item.metadata.annotations[clientLabels.NAMESPACE];
            const deploymentName = item.spec.selector.app;
            winston.debug('stream send new namespaces for:' + deploymentName);

            const deployments = await this.client.apis.apps.v1beta2
                                .namespaces(namespaceName).deployments.get();
            const compareDeployments = deployments.body.items.filter((one) => {
              return one.spec.template.metadata.labels.app === deploymentName;
            });
            this.deploymentsNames[deploymentName] = true;
            let created = '';
            compareDeployments.forEach((one) => {
              created += one.metadata.creationTimestamp + ' ' + one.metadata.resourceVersion;
            });
            this.deleteEndpoint(namespace, deploymentName);
            if (this.endpoints[namespace] === undefined) {
              this.endpoints[namespace] = [];
            }
            this.endpoints[namespace].push({
              url,
              namespace,
              typePrefix: namespace + '_',
              __created: created,
              __imageID: '',
              __deploymentName: deploymentName,
            });
            this.callDataUpdateListener();

          }
          break;
        }
        case 'DELETED': {
          if (idx(item, _ => _.metadata.annotations[clientLabels.TOKEN]) === token()) {
            const namespace = item.metadata.annotations[clientLabels.NAMESPACE];
            const deploymentName = item.spec.selector.app;
            winston.debug('delete service', namespace, deploymentName);
            this.deleteEndpoint(namespace, deploymentName);
            winston.debug('delete service no data', this.endpoints);
            this.callDataUpdateListener();

          }
        }
      }
    });

    this.streams[namespaceName] = {
      service: servicesStream,
    };

  }

  watchEndpoint = async() => {

    winston.info('Load K8s');
    switch (kubernetesConfigurationKind()){
      case 'fromKubeconfig': {
        winston.info('Load fromKubeconfig');
        this.client = new Client({ config: config.fromKubeconfig() });
        break;
      }
      case 'getInCluster': {
        winston.info('Load getInCluster');
        this.client = new Client({ config: config.getInCluster() });
        break;
      }
      case 'getInClusterByUser': {
        winston.info('Load getIntClusterByUser');
        this.client = new Client({ config: getInClusterByUser() });
      }
    }
    await this.client.loadSpec();
    try {
      const namespaceStream = this.client.api.v1.watch.namespaces.getStream();
      const namespaceJsonStream = new JSONStream();
      namespaceStream.pipe(namespaceJsonStream);
      namespaceJsonStream.on('data', (object) => {
        const name = object.object.metadata.name;
        switch (object.type){
          case 'ADDED': {
            this.watchServicesForNamespace(name);
            this.watchDeploymentsForNamespace(name);
            this.watchPodsForNamespace(name);
            break;
          }
          case 'DELETED': {
            this.abortServicesForNamespace(name);
            this.abortDeploymentsForNamespace(name);
            this.abortPodsForNamespace(name);
            break;

          }
        }
      });
    } catch (err) {
      winston.error('Error by watchEndpoints', err);
    }

  }

}
