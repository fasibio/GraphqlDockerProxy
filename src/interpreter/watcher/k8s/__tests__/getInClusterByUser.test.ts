import { getInClusterByUser } from '../getInClusterByUser'
jest.mock('../../../../properties', () => {
  return {
    k8sUser: () => {
      return 'mockUser'
    },
    k8sUserPassword:() => {
      return 'mockPassword'
    },
  }

})
describe('tests the getInClusterByUser', () => {
  it('snapshot result', () => {
    process.env.KUBERNETES_SERVICE_HOST = 'mockHost'
    process.env.KUBERNETES_SERVICE_PORT = 'mockPort'
    expect(getInClusterByUser()).toMatchSnapshot()
  })
})
