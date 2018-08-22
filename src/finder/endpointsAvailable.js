import fetch from 'node-fetch'
import type { Endpoints } from './findEndpointsInterface'
import sleep from 'sleep-promise'
const queryStr = '?query=%7B__schema%7Btypes%7Bname%7D%7D%7D'


export const allEndpointsAvailable = async(endpoints :Endpoints): Endpoints => {
  winston.info('check that all endpoints are available')
  let allEndpointsAvailable = false
  let counter = 0
  while (!allEndpointsAvailable && counter < 10){
    allEndpointsAvailable = true
    counter = counter + 1
    for (const namespace in endpoints){
      const oneNamespace = endpoints[namespace]
      for (let i = 0; i < oneNamespace.length; i++){
        const one = oneNamespace[i]
        const result = await fetch(one.url + queryStr, {
          timeout: 2000,
        }).then(res => {
          return {
            status: res.status,
            ok: res.ok,
          }
        })
          .catch(() => {
            return {
              status: 404,
              ok: false,
            }
          })
        if (!result.ok){
          winston.warn('allEndpointsAvailable: Endpoint not Available: ', one)
          allEndpointsAvailable = false
        }

      }
    }
    if (!allEndpointsAvailable){
      winston.info('wait a second and try it again')
      await sleep(1000)
    }
  }
  if (!allEndpointsAvailable){
    winston.warn('some Endpoint not Available')
    return false
  }
  return true
}

export const sortEndpointAndFindAvailableEndpoints = async(endpoints :Endpoints): Endpoints => {
  for (const namespace in endpoints){
    const oneNamespace = endpoints[namespace]
    for (let i = 0; i < oneNamespace.length; i++){
      const one = oneNamespace[i]
      const result = await fetch(one.url + queryStr, {
        timeout: 2000,
      }).then(res => {
        return {
          status: res.status,
          ok: res.ok,
        }
      })
        .catch(() => {
          return {
            status: 404,
            ok: false,
          }
        })
      if (!result.ok){
        winston.warn('Endpoint not Available: ', one)
        delete oneNamespace.splice(i, 1)
      }

    }
    if (oneNamespace.length === 0){
      delete endpoints[namespace]
    }

  }
  return endpoints
}
