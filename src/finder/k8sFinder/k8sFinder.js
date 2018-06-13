
//@flow
const Client = require('kubernetes-client').Client
const config = require('kubernetes-client').config
import { FindEndpoints } from '../findEndpointsInterface'
export class K8sFinder extends FindEndpoints{
  constructor(){
    super()
  }


  getEndpoints = async() => {
    const client = new Client({ config: config.fromKubeconfig() })
    await client.loadSpec()
    // const namespaces = await client.api.v1.namespaces.get()
    // console.log(Object.keys(client.api.extension.v1beta1.deployments.get()))
    const services = await client.api.v1.services.get()//client.api.v1.services.get()
    console.log(JSON.stringify(services))
    // namespaces.body.items.forEach((one) => {
    //   console.log('hier bin ich ', JSON.stringify(one))

    // })
    return {}
  }
}

