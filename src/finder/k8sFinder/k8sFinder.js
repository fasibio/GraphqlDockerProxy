const Client = require('kubernetes-client').Client

export const getEndpoints = async() => {
  const client = new Client({
    config: {
      url: '',
    },
  })
}
