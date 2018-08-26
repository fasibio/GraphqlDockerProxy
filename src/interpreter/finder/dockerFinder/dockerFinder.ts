import { Docker } from 'node-docker-api';
import { token, network } from '../../../properties';
import { foundEquals } from '../../loadBalancer';
import { FindEndpoints } from '../findEndpointsInterface';
import { Endpoints } from '../../endpoints';
import * as clientLabels from '../../clientLabels';
export class DockerFinder extends FindEndpoints{
  constructor() {
    super();
  }

  handleRestart = (endpoints : Endpoints): Promise<Endpoints> => {
    return this.foundEquals(endpoints);
  }

  foundEquals = async(datas: Endpoints) :Promise<Endpoints> => {
    return await foundEquals(datas);
  }

  /**
 * Schaut ob es sich um eine absolute url handelt.(Startet mit http(s)://)
 * Wenn nicht sucht sie die ip des netzwerkes raus.
 * (Relative URL z.B.: :{port}{suburl}(:3001/graphql))
 *
 *
 */
  updateUrl = (url:string, sockData:any) :string => {
    if (url.startsWith('http')) {
      return url;
    }
    return 'http://' + sockData.NetworkSettings.Networks[network()].IPAddress + url;

  }

  getEndpoints = async(): Promise<Endpoints> => {
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });

    return await docker.container.list().then((containers) => {
      const result = {};
      containers.forEach((one) => {
        if (idx(one, _ => _.data.Labels[clientLabels.TOKEN]) + '' === token()) {
          const url = idx(one, _ => _.data.Labels[clientLabels.URL]);
          const namespace = idx(one, _ => _.data.Labels[clientLabels.NAMESPACE]);
          if (result[namespace] === undefined) {
            result[namespace] = [];
          }

          result[namespace].push({
            namespace,
            url: this.updateUrl(url, one.data),
            typePrefix: namespace + '_',
            __created: idx(one, _ => _.data.Created),
            __imageID: idx(one, _ => _.data.Image),
          });
        } else {
          // console.log('no gqlProxy labels set')
        }
      });

      return result;
    });
  }
}
