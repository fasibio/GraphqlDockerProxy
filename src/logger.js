const winston = require('winston')
const { getLogLevel } = require('./properties')


global.winston = winston.createLogger({
  level: getLogLevel(),

  // format: winston.format.simple(),

  format: winston.format.combine(
    winston.format.simple(),
    winston.format.timestamp(),
  ),
  transports: [
    new winston.transports.Console(),
  ],
})
