import { resolvers, typeDefs } from '../k8sSchema'
import { clearAll } from '../../interpreter/finder/k8sFinder/blacklist'
jest.mock('../../interpreter/finder/k8sFinder/blacklist', () => {
  return {
    getBlacklist: () => {
      return [
        '1',
        '2',
        '3',
      ]
    },
    clearAll: jest.fn(),
  }
})
describe('test k8sSchema', () => {
  it('snapshot the typeDefs', () => {

    expect(typeDefs).toMatchSnapshot()// tslint:disable-line
  })

  it('snapshot the resolver function', () => {
    expect(resolvers).toMatchSnapshot()// tslint:disable-line

  })

  it('tests resolver kubernetes=>blacklist ', () => {

    expect(resolvers.Query.kubernetes().blacklist()).toMatchSnapshot()// tslint:disable-line
  })
  it('tests resolver kubernetes=>clearBlackList ', () => {
    expect(resolvers.Query.kubernetes().clearBlackList()).toBeTruthy()// tslint:disable-line
    expect(clearAll).toBeCalled()

  })
})
