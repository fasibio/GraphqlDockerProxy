import { addNamespaceToBlacklist,
  clearAll,
  getBlacklist,
  isNamespaceAtBlacklist } from '../blacklist';
describe('Tests the blacklist do the job', () => {
  beforeEach(() => {
    clearAll();
  });

  it('tests addNamespaceToBlacklist, clearAll, getBlacklist, isNamespaceAtBlacklist ', () => {
    const data = [
      'testNamespace',
    ];
    addNamespaceToBlacklist(data[0]);
    expect(getBlacklist()).toEqual(data);
    expect(isNamespaceAtBlacklist(data[0])).toBe(true);
    expect(isNamespaceAtBlacklist('not on list')).toBe(false);
    clearAll();
    expect(getBlacklist()).toEqual([]);
  });

});
