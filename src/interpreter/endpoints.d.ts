export interface Endpoint {
  url: string;
  namespace: string;
  typePrefix: string;
  __created: string;
  __intospection?: object;
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