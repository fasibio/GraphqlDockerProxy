// @flow

export interface Endpoint {
  url: string;
  namespace: string;
  typePrefix: string;
  __created: string;
  __imageID: string;
  __burnd?: boolean;
  __deploymentName : string;
  __loadbalance?: __loadbalance;
}

interface __loadbalance {
  count: number;
  endpoints: Endpoints;
}

export type Endpoints = {
  [key : string]: Endpoint[],
};

class FindEndpoints{

  constructor() {}
  getEndpoints = (): Promise<Endpoints> => {
    winston.error('you have to override getEndpoints');
    return Promise.resolve({});
  }

  /**
   * If getEndpoints have different to the past
   * here you can do extra handling like loadbalacing etc...
   */
  handleRestart = (endpoints: Endpoints) : Promise<Endpoints> => {
    return Promise.resolve(endpoints);
  }

}

export { FindEndpoints };
