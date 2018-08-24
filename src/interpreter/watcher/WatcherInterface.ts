
// @flow
import { Endpoints } from '../endpoints';
import * as cloner from 'cloner';

type dataUpdatedListener = (data: Endpoints) => void;

class WatcherInterface{
  endpoints: Endpoints = {};

  constructor() {}

  dataUpdatedListener: dataUpdatedListener;

  watchEndpoint = () => {
    winston.error('you have to override watchEndpoint');
  }

  setDataUpdatedListener = (listener:dataUpdatedListener) => {
    this.dataUpdatedListener = listener;
  }

  callDataUpdateListener = async() => {
    const realEndpoint = cloner.deep.copy(this.endpoints);
    for (const one in realEndpoint) {
      if (realEndpoint[one].length === 0) {
        delete realEndpoint[one];
      }

    }
    this.dataUpdatedListener(realEndpoint);
  }

  deleteEndpoint = (namespace: string, uniqueIdentifier: string) => {
    if (this.endpoints[namespace] === undefined) {
      return;
    }
    for (let i = 0 ; i < this.endpoints[namespace].length; i = i + 1) {
      if (this.endpoints[namespace][i].__deploymentName === uniqueIdentifier) {
        this.endpoints[namespace].splice(i, 1);
      }
    }
    if (this.endpoints[namespace].length === 0) {
      delete this.endpoints[namespace];
    }
  }
}

export { WatcherInterface };
