import { renderPage } from 'tests/unit/helpers';

afterEach(() => {
  jest.useRealTimers();
});

describe(__filename, () => {
  it('throws a simulated error', () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    renderPage({ initialEntries: ['/en-US/firefox/simulate-async-error/'] });

    expect(() => jest.advanceTimersByTime(51)).toThrowError(
      /simulated asynchronous error/,
    );
  });
});
