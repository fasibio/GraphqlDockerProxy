import { k8sUser, k8sUserPassword } from '../../properties';

export const getInClusterByUser = () => {

  const host = process.env.KUBERNETES_SERVICE_HOST;
  const port = process.env.KUBERNETES_SERVICE_PORT;

  return {
    url: 'https://' + host + ':' + port,
    auth: {
      user: k8sUser(),
      pass: k8sUserPassword(),
    },
    insecureSkipTlsVerify: true,
  };

};
