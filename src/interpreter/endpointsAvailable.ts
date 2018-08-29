import fetch from 'node-fetch'
import  { Endpoints } from './endpoints'
// tslint:disable-next-line
const queryStr = '?query=%0A%20%20%20%20query%20IntrospectionQuery%20%7B%0A%20%20%20%20%20%20__schema%20%7B%0A%20%20%20%20%20%20%20%20queryType%20%7B%20name%20%7D%0A%20%20%20%20%20%20%20%20mutationType%20%7B%20name%20%7D%0A%20%20%20%20%20%20%20%20subscriptionType%20%7B%20name%20%7D%0A%20%20%20%20%20%20%20%20types%20%7B%0A%20%20%20%20%20%20%20%20%20%20...FullType%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20directives%20%7B%0A%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20description%0A%20%20%20%20%20%20%20%20%20%20locations%0A%20%20%20%20%20%20%20%20%20%20args%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20...InputValue%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20fragment%20FullType%20on%20__Type%20%7B%0A%20%20%20%20%20%20kind%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20description%0A%20%20%20%20%20%20fields(includeDeprecated%3A%20true)%20%7B%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20description%0A%20%20%20%20%20%20%20%20args%20%7B%0A%20%20%20%20%20%20%20%20%20%20...InputValue%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20type%20%7B%0A%20%20%20%20%20%20%20%20%20%20...TypeRef%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20isDeprecated%0A%20%20%20%20%20%20%20%20deprecationReason%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20inputFields%20%7B%0A%20%20%20%20%20%20%20%20...InputValue%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20interfaces%20%7B%0A%20%20%20%20%20%20%20%20...TypeRef%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20enumValues(includeDeprecated%3A%20true)%20%7B%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20description%0A%20%20%20%20%20%20%20%20isDeprecated%0A%20%20%20%20%20%20%20%20deprecationReason%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20possibleTypes%20%7B%0A%20%20%20%20%20%20%20%20...TypeRef%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20fragment%20InputValue%20on%20__InputValue%20%7B%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20description%0A%20%20%20%20%20%20type%20%7B%20...TypeRef%20%7D%0A%20%20%20%20%20%20defaultValue%0A%20%20%20%20%7D%0A%0A%20%20%20%20fragment%20TypeRef%20on%20__Type%20%7B%0A%20%20%20%20%20%20kind%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20ofType%20%7B%0A%20%20%20%20%20%20%20%20kind%0A%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20ofType%20%7B%0A%20%20%20%20%20%20%20%20%20%20kind%0A%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20ofType%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20kind%0A%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20ofType%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20kind%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20ofType%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20kind%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20ofType%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20kind%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20ofType%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20kind%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20name%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20' 
export const sortEndpointAndFindAvailableEndpoints =
async(endpoints :Endpoints): Promise<Endpoints> => {
  for (const namespace in endpoints) {
    const oneNamespace = endpoints[namespace]
    for (let i = 0; i < oneNamespace.length; i = i + 1) {
      const one = oneNamespace[i]
      const result = await fetch(one.url + queryStr, {
        timeout: 2000,
      }).then(async(res) => {
        return {
          json: await res.json(),
          status: res.status,
          ok: res.ok,
        }
      })
        .catch((err) => {
          winston.debug('Error by fetching', { err, url: one.url })
          return {
            json: {},
            status: 404,
            ok: false,
          }
        })
      if (!result.ok) {
        winston.warn('Endpoint not Available: ', { url: one.url , namespace: one.namespace })
        oneNamespace.splice(i, 1)
      } else {
        oneNamespace[i].__introspection = result.json
      }

    }
    if (oneNamespace.length === 0) {
      delete endpoints[namespace]
    }

  }
  return endpoints
}
