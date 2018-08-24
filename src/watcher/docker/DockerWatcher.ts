
import * as clientLabels from '../../finder/clientLabels';
import { token, network } from '../../properties';
import { WatcherInterface } from '../WatcherInterface';
import * as monitor from 'node-docker-monitor';

export class DockerWatcher extends WatcherInterface{

  constructor() {
    super();
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

  onContainerUp = (container: any) => {
    if (container.Labels[clientLabels.TOKEN] === token()) {
      const url = container.Labels[clientLabels.URL];
      const namespace :string = container.Labels[clientLabels.NAMESPACE];
      const deploymentName = container.Id;
      this.deleteEndpoint(namespace, deploymentName);

      if (this.endpoints[namespace] === undefined) {
        this.endpoints[namespace] = [];
      }
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
