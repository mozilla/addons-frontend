import tracking from 'blog-utils/tracking';

describe(__filename, () => {
  it('defines noop methods for tracking', () => {
    expect(tracking.sendEvent()).toEqual(undefined);
    expect(tracking.setUserProperties()).toEqual(undefined);
  });
});
