import fetch from 'node-fetch';
import  { Endpoints } from './endpoints';
const queryStr = '?query=%7B__schema%7Btypes%7Bname%7D%7D%7D';
export const sortEndpointAndFindAvailableEndpoints =
async(endpoints :Endpoints): Promise<Endpoints> => {
  for (const namespace in endpoints) {
    const oneNamespace = endpoints[namespace];
    for (let i = 0; i < oneNamespace.length; i = i + 1) {
      const one = oneNamespace[i];
      const result = await fetch(one.url + queryStr, {
        timeout: 2000,
      }).then((res) => {
        return {
          status: res.status,
          ok: res.ok,
        };
      })
        .catch((err) => {
          winston.debug('Error by fetching', { err, url: one.url });
          return {
            status: 404,
            ok: false,
          };
        });
      if (!result.ok) {
        winston.warn('Endpoint not Available: ', { url: one.url , namespace: one.namespace });
        oneNamespace.splice(i, 1);
      }

    }
    if (oneNamespace.length === 0) {
      delete endpoints[namespace];
    }

  }
  return endpoints;
};
