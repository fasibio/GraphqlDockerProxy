import * as winston from 'winston'
global.winston = winston.createLogger({
  level: 'info',

  // format: winston.format.simple(),

  format: winston.format.combine(
    winston.format.simple(),
    winston.format.timestamp(),
  ),
  transports: [
    new winston.transports.Console(),
  ],
})
