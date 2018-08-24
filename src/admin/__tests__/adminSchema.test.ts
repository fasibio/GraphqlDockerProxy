import schema from '../adminSchema';
import { clearAll } from '../../interpreter/finder/k8sFinder/blacklist';
jest.mock('../../interpreter/finder/k8sFinder/blacklist', () => {
  return {
    getBlacklist: () => {
      return [
        '1',
        '2',
        '3',
      ];
    },
    clearAll: jest.fn(),
  };
});
jest.mock('../../properties', () => {
  return {
    getBuildNumber: () => 'mockBnNumber',
    getVersion: () => 'mockVersion',
    getPollingMs: () => 5000,
  };
});
jest.mock('graphql-tools', () => {
  return {
    makeExecutableSchema: (obj) => {
      return obj;
    },
  };
});

describe('tests the adminSchema', () => {
  it('snapshot the typedefs', () => {

    expect(schema.typeDefs).toMatchSnapshot()// tslint:disable-line
  });

  it('snapshot the resolver function', () => {
    expect(schema.resolvers).toMatchSnapshot()// tslint:disable-line
  });

  it('tests resolver configuration', () => {
    expect(schema.resolvers.Query.configuration()).toMatchSnapshot// tslint:disable-line
  });
  it('tests resolver kubernetes=>blacklist ', () => {
    expect(schema.resolvers.Query.kubernetes().blacklist()).toMatchSnapshot()// tslint:disable-line
  });

  it('tests resolver kubernetes=>clearBlackList ', () => {
    expect(schema.resolvers.Query.kubernetes().clearBlackList()).toBeTruthy()// tslint:disable-line
    expect(clearAll).toBeCalled();

  });

  describe('tests resolver namespaces', () => {
    it('tests struct', () => {
      const inputData = [
        {
          url: 'mockUrl',
          __created: 'mock created',
          __imageID: 'mock image id',
        },
        {
          url: 'mockUrl2',
          __created: 'mock created2',
          __imageID: 'mock image id2',
          __loadbalance: {
            count: 2,
            endpoints: [
              {
                url: 'mockUrl3',
                __created: 'mock create3',
                __imageID: 'mock image id3',
              },
              {
                url: 'mockUrl4',
                __created: 'mock create4',
                __imageID: 'mock image id4',
              },
            ],
          },
        },
      ];
      const endpoints = {
        testNamspace: inputData,
      };
      expect(schema.resolvers.Query.namespaces({}, {}, { endpoints })).toMatchSnapshot();
    });
  });

});
