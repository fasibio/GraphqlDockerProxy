import { DockerFinder } from '../dockerFinder';
import { Endpoints } from '../../../endpoints';
jest.mock('../../../endpointsAvailable', () => {
  return {
    sortEndpointAndFindAvailableEndpoints: (data) => {
      return Promise.resolve(data);
    },
  };
});
jest.mock('../../../loadBalancer', () => {
  return {
    foundEquals: (endpoints: Endpoints): Promise<Endpoints> => {
      return Promise.resolve(endpoints);
    },
    closeAllServer: () => {},
    loadANewLoadBalaceMiddleware: (listOfBackends) => {
      return {
        url: 'http://127.0.0.1:8001',
        clients: listOfBackends.map((one) => {
          return Object.assign({}, one);
        }),
      };

    },
  };
});
jest.mock('../../../../properties', () => {
  return {
    token: () => {
      return '1234';
    },
    network: () => {
      return 'web';
    },
  };
});
jest.mock('node-docker-api');
describe('Tests the docḱerfinder Class', () => {
  let dockerFinder = null;
  beforeEach(() => {
    dockerFinder = new DockerFinder();
  });

  describe('tests method getEndpoints', () => {
    xit('gives a list of object and filter the right endpoints', async() => {
      const endpoints = await dockerFinder.getEndpoints();
      expect(endpoints).toMatchSnapshot();
    });
  });

  describe('tests handleRestart', () => {
    xit('tests there does not need loadbalance no change at endpoints ', async() => {
      const endpoints = await dockerFinder.getEndpoints();
      const newEndpoints = await dockerFinder.handleRestart(endpoints);
      expect(endpoints).toEqual(newEndpoints);
    });

    xit('tests there need loadbalance endpoints change ', async() => {
      const endpoints = await dockerFinder.getEndpoints();
      endpoints['one'].push({
        url: 'http://124.122.123.123:8000/graphql',
        namespace: 'one',
        typePrefix: 'one_',
        created: '20180101',
        __imageID: 'one',
      });
      const newEndpoints = await dockerFinder.handleRestart(endpoints);
      expect(newEndpoints['one'][0]).toMatchSnapshot();

    });

  });
  describe('tests updateUrl ', () => {
    it('by absolut url', () => {
      const url = 'https://test.de/graphql';
      expect(dockerFinder.updateUrl(url, {})).toBe(url);
    });
    it('by relativ url', () => {
      const sockData = {
        NetworkSettings: {
          Networks: {
            web: {
              IPAddress: '127.0.0.1',
            },
          },
        },
      };
      expect(dockerFinder.updateUrl(':3000/graphql', sockData))
      .toBe('http://127.0.0.1:3000/graphql');
    });
  });

});
