import { Docker } from 'node-docker-api'
import { token, network } from './properties'
import { loadANewLoadBalaceMiddleware, closeAllServer } from './loadBalancer'
/**
 * Schaut ob es sich um eine absolute url handelt.(Startet mit http(s)://)
 * Wenn nicht sucht sie die ip des netzwerkes raus. (Relative URL z.B.: :{port}{suburl}(:3001/graphql))
 * 
 * 
 */
const updateUrl = (url, sockData) => {
  if (url.startsWith('http')){
    return url
  } else {
    return 'http://' + sockData.NetworkSettings.Networks[network()].IPAddress + url
  }
}

// gqlProxy.token=1234
// - gqlProxy.port=8100
// - gqlProxy.subUrl=/graphql
// - gqlProxy.namespace=auth
// - gqlProxy.typePrefix=auth_
export const getDockerEndpoints = async() => {
  const docker = new Docker({ socketPath: '/var/run/docker.sock' })

  return await docker.container.list().then(containers => {
    const result = {}
    containers.forEach(one => {
      if (one.data.Labels['gqlProxy.token'] == token()){
        const url = one.data.Labels['gqlProxy.url']
        const namespace = one.data.Labels['gqlProxy.namespace']
        if (result[namespace] == undefined){
          result[namespace] = []
        }
        result[namespace].push({
          url: updateUrl(url, one.data),
          namespace,
          typePrefix: namespace + '_',
          __created: one.data.Created,
          __imageID: one.data.Image,
        })
      } else {
        console.log('no gqlProxy labels set')
      }
      // console.log(one.data.Labels['traefik.port'])
      // console.log(one.data.Ports)
    })


    return result
  })

}

export const foundEquals = (data) => {

  closeAllServer()
  for (const one in data){
    const namespace = data[one]
    for (let i = 0, l = namespace.length; i < l; i++){
      const lbData = {}
      const searchingElement = namespace[i]
      if (searchingElement.__burnd === undefined){
        for (let j = i + 1; j < l; j++){
          const testingElement = namespace[j]

          if (searchingElement.__imageID == testingElement.__imageID){
            if (lbData[searchingElement.__imageID] === undefined){
              lbData[searchingElement.__imageID] = []
            }
            lbData[searchingElement.__imageID].push(testingElement)
            namespace[j].__burnd = true
          // namespace.splice(j)
          }


        }
        if (lbData[searchingElement.__imageID] !== undefined){
          lbData[searchingElement.__imageID].push(searchingElement)
          namespace[i].url = loadANewLoadBalaceMiddleware(lbData[searchingElement.__imageID])
        }
      }
      data[one] = namespace.filter(one => {
        return !one.__burnd
      })

    }

  }

  return data
}
