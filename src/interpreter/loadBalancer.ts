import * as express from 'express';
import * as request from 'request';
import { sortEndpointAndFindAvailableEndpoints } from './endpointsAvailable';
import { Endpoints } from './endpoints';
let lBserver = [];

export const foundEquals = async(datas: Endpoints) :Promise<Endpoints> => {
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
};

export const loadANewLoadBalaceMiddleware = (listOfBackends) => {

  const servers = listOfBackends.map((one) => {
    return one.url;
  });
  let cur = 0;

  const handler = (req, res) => {

    // console.log('hier:', req.headers, servers.length)
    if (req.url === '/') {
      req.url = '';
    }
    req.pipe(request({ url: servers[cur] + req.url })).pipe(res);
    cur = (cur + 1) % servers.length;
  };
  const server = express();
  server.get('*', handler).post('*', handler);
  server.post('*', handler).post('*', handler);
  const port = getNextPortNumber();
  lBserver.push(server.listen(port));
  return {
    url: 'http://127.0.0.1:' + port + '',
    clients: listOfBackends.map((one) => {
      return Object.assign({}, one);
    }),
  };
};

let nextPortNumber = 0;
const getNextPortNumber = () => {
  nextPortNumber = nextPortNumber + 1;
  return 8000 + nextPortNumber;
};

export const closeAllServer = () => {
  lBserver.forEach((one) => {
    winston.info('close load balancer', one._connectionKey);
    one.close();
  });
  nextPortNumber = 0;
  lBserver = [];
};
