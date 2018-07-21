import { K8sFinder } from '../k8sFinder'

describe('tests K8sFinder', () => {
  let k8sFinder = null
  beforeEach(() => {
    k8sFinder = new K8sFinder()
  })
  describe('tests updateUrl ', () => {
    it('by absolut url', () => {
      const url = 'https://test.de/graphql'
      expect(k8sFinder.updateUrl(url, {})).toBe(url)
    })
    it('by relativ url', () => {
      const sockData = {
        metadata: {
          name: 'test',
          namespace: 'testNamespace',
        },
      }
      expect(k8sFinder.updateUrl(':3000/graphql', sockData)).toBe('http://test.testNamespace:3000/graphql')
    })
  })
})
