//@flow
import fetch from 'node-fetch'
import type { Endpoints } from './findEndpointsInterface'

const queryStr = '?query=%7B__schema%7Btypes%7Bname%7D%7D%7D'


export const sortEndpointAndFindAvailableEndpoints = async(endpoints :Endpoints): Endpoints => {
  for (const namespace in endpoints){
    console.log(endpoints[namespace])
    for (const one in endpoints[namespace]){
      await fetch(endpoints[namespace][one].url + queryStr).then(res => {
        console.log(endpoints[namespace][one].url + queryStr)
        console.log('ok', res.ok)
        console.log('status', res.status)
        console.log('statusText', res.statusText)
      })

    }

  }
}
