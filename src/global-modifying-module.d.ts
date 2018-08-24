export {}
import * as winston from 'winston'
declare global {
  function idx(obj: any, callBack: (obj: any) => any) : any
  const winston : winston.Logger
}