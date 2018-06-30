import express from 'express'
import request from 'request'

let lBserver = []

export const loadANewLoadBalaceMiddleware = (listOfBackends) => {

  const servers = listOfBackends.map(one => {
    return one.url
  })
  let cur = 0

  const handler = (req, res) => {

    // console.log('hier:', req.headers, servers.length)
    if (req.url === '/'){
      req.url = ''
    }
    req.pipe(request({ url: servers[cur] + req.url })).pipe(res)
    cur = (cur + 1) % servers.length
  }
  const server = express()
  server.get('*', handler).post('*', handler)
  server.post('*', handler).post('*', handler)
  const port = getNextPortNumber()
  lBserver.push(server.listen(port))
  return {
    url: 'http://127.0.0.1:' + port + '',
    clients: listOfBackends.map((one) => Object.assign({}, one)),
  }
}

let nextPortNumber = 0
const getNextPortNumber = () => {
  nextPortNumber = nextPortNumber + 1
  return 8000 + nextPortNumber
}

export const closeAllServer = () => {
  lBserver.forEach(one => {
    console.log('close load balancer', one._connectionKey)
    one.close()
  })
  nextPortNumber = 0
  lBserver = []
}
