import * as winston from 'winston';
import { getLogLevel, getLogFormat } from'./properties';
import * as cluster from 'cluster';

let logFormat = winston.format.simple();
switch (getLogFormat()){
  case 'simple': {
    logFormat = winston.format.simple();
    break;
  }
  case 'json': {
    logFormat = winston.format.json();
    break;
  }

}

const workingClusterFormat = winston.format((info) => {
  if (cluster.isMaster) {
    info.serverRole = 'master';
  } else {
    info.serverRole = 'slave: ' + cluster.worker.id;
  }
  return info;
});

global.winston = winston.createLogger({
  level: getLogLevel(),

  // format: winston.format.simple(),

  format: winston.format.combine(
    workingClusterFormat(),
    winston.format.timestamp(),
    logFormat,
  ),
  transports: [
    new winston.transports.Console(),
  ],
});
