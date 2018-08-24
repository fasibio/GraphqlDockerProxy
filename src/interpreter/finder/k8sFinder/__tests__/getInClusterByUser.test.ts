import { getInClusterByUser } from '../getInClusterByUser';
jest.mock('../../../../properties', () => {
  return {
    k8sUser: () => 'mockuser',
    k8sUserPassword: () => 'mockpw',
  };
});
describe('tests k8s login func getInClusterByUser', () => {
  it('tests returns valid json', () => {
    process.env.KUBERNETES_SERVICE_HOST = 'mockHost';
    process.env.KUBERNETES_SERVICE_PORT = 'mockport';
    expect(getInClusterByUser()).toMatchSnapshot();
  });
});
