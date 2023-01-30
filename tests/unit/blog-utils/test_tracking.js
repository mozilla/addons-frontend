import tracking from 'blog-utils/tracking';

describe(__filename, () => {
  it('defines noop methods for tracking', () => {
    expect(tracking.sendEvent()).toEqual(undefined);
    expect(tracking.pageView()).toEqual(undefined);
    expect(tracking.setPage()).toEqual(undefined);
    expect(tracking.setDimension()).toEqual(undefined);
    expect(tracking.setUserProperties()).toEqual(undefined);
    expect(tracking.sendWebVitalStats()).toEqual(undefined);
  });
});
