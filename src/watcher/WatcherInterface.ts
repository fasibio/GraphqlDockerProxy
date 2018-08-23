
// @flow
import { Endpoints } from '../finder/findEndpointsInterface';

type dataUpdatedListener = (data: Endpoints) => void;

class WatcherInterface{
  constructor() {}

  dataUpdatedListener: dataUpdatedListener;

  watchEndpoint = () => {
    winston.error('you have to override watchEndpoint');
  }

  setDataUpdatedListener = (listener:dataUpdatedListener) => {
    this.dataUpdatedListener = listener;
  }
}

export { WatcherInterface };
