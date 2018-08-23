
import { Endpoints } from '../../finder/findEndpointsInterface';
import cloner from 'cloner';
import * as clientLabels from '../../finder/clientLabels';
import { token, network } from '../../properties';
import { WatcherInterface } from '../WatcherInterface';
import * as monitor from 'node-docker-monitor';

export class DockerWatcher extends WatcherInterface{
  endpoints : Endpoints = {};

  constructor() {
    super();
  }
  callDataUpdateListener = async() => {
    const realEndpoint = cloner.deep.copy(this.endpoints);
    for (const one in realEndpoint) {
      if (realEndpoint[one].length === 0) {
        delete realEndpoint[one];
      }

    }
    console.log(realEndpoint);
    this.dataUpdatedListener(realEndpoint);

  }

  /**
 * Schaut ob es sich um eine absolute url handelt.(Startet mit http(s)://)
 * Wenn nicht sucht sie die ip des netzwerkes raus.
 * (Relative URL z.B.: :{port}{suburl}(:3001/graphql))
 */
  updateUrl = (url:string, sockData:any) :string => {
    if (url.startsWith('http')) {
      return url;
    }
    return 'http://' + sockData.NetworkSettings.Networks[network()].IPAddress + url;

  }

  deleteEndpoint = (namespace: string, deploymentName: string) => {
    if (this.endpoints[namespace] === undefined) {
      return;
    }
    for (let i = 0 ; i < this.endpoints[namespace].length; i = i + 1) {
      if (this.endpoints[namespace][i].__deploymentName === deploymentName) {
        this.endpoints[namespace].splice(i, 1);
      }
    }
    if (this.endpoints[namespace].length === 0) {
      delete this.endpoints[namespace];
    }
  }

  onContainerUp = (container: any) => {
    if (container.Labels[clientLabels.TOKEN] === token()) {
      const url = container.Labels[clientLabels.URL];
      const namespace = container.Labels[clientLabels.NAMESPACE];
      const deploymentName = container.Id;
      this.deleteEndpoint(namespace, deploymentName);

      if (this.endpoints[namespace] === undefined) {
        this.endpoints[namespace] = [];
      }
      // $FlowFixMe: suppressing this error until we can refactor
      this.endpoints[namespace].push({
        namespace,
        url: this.updateUrl(url, container),
        typePrefix: namespace + '_',
        __created: container.Created,
        __imageID: container.Image,
        __deploymentName: deploymentName,
      });
      this.callDataUpdateListener();
    }
  }

  onContainerDown = (container) => {};
  watchEndpoint = () => {
    monitor({
      onMonitorStarted: () => {},
      onMonitorStopped: () => {},
      onContainerUp: this.onContainerUp,
      onContainerDown: this.onContainerDown,
    });
  }
}
