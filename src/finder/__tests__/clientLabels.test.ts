import * as clientLabels from '../clientLabels';
describe('the labels to known thats to include', () => {
  it('Snapshot the labels', () => {
    expect(clientLabels).toMatchSnapshot();
  });
});
