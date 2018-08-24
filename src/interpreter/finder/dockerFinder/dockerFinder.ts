import { Docker } from 'node-docker-api';
import { token, network } from '../../../properties';
import { loadANewLoadBalaceMiddleware, closeAllServer } from './loadBalancer';
import { FindEndpoints } from '../findEndpointsInterface';
import { Endpoints } from '../../endpoints';
import * as clientLabels from '../../clientLabels';
import { sortEndpointAndFindAvailableEndpoints } from '../../endpointsAvailable';
export class DockerFinder extends FindEndpoints{
  constructor() {
    super();
  }

  handleRestart = (endpoints : Endpoints): Promise<Endpoints> => {
    return this.foundEquals(endpoints);
  }

  foundEquals = async(datas: Endpoints) :Promise<Endpoints> => {
    const data = await sortEndpointAndFindAvailableEndpoints(datas);
    closeAllServer();
    for (const one in data) {
      const namespace = data[one];
      for (let i = 0, l = namespace.length; i < l; i = i + 1) {
        const lbData = {};
        const searchingElement = namespace[i];
        if (searchingElement.__burnd === undefined) {
          for (let j = i + 1; j < l; j = j + 1) {
            const testingElement = namespace[j];

            if (searchingElement.__imageID === testingElement.__imageID) {
              if (lbData[searchingElement.__imageID] === undefined) {
                lbData[searchingElement.__imageID] = [];
              }
              lbData[searchingElement.__imageID].push(testingElement);
              namespace[j].__burnd = true;
            // namespace.splice(j)
            }

          }
          if (lbData[searchingElement.__imageID] !== undefined) {
            lbData[searchingElement.__imageID].push(searchingElement);
            const lbResult = loadANewLoadBalaceMiddleware(lbData[searchingElement.__imageID]);
            namespace[i].url = lbResult.url;
            namespace[i].__loadbalance = {
              count: namespace.length,
              endpoints: lbResult.clients,
            };

          }
        }
        const newNamespaces = [];
        for (const oneBurable in namespace) {
          if (!namespace[oneBurable].__burnd) {
            newNamespaces.push(namespace[oneBurable]);
          }
        }
        data[one] = newNamespaces;

      }

    }

    return data;
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
