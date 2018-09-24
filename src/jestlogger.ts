global.winston = {

  get format () {
    return {
      combine: (...args) => {
        return args
      },
      simple: () => {
        return 'simple'
      },
      json: () => {
        return 'json'
      },
    }
  },

  set format(d) {},
  createLogger:  (config) => {
    return config
  },
  combine: () => {

  },
  debug: (...args) => {
    console.log(args)
  },
  info: (...args) => {
    console.log(args)
  },
  warn: (...args) => {
    console.log(args)
  },
  error: (...args) => {
    console.log(args)
  },
}
