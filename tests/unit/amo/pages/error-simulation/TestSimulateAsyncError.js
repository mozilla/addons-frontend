import { renderPage } from 'tests/unit/helpers';

jest.useFakeTimers();

describe(__filename, () => {
  it('throws a simulated error', () => {
    renderPage({ initialEntries: ['/en-US/firefox/simulate-async-error/'] });

    expect(() => jest.advanceTimersByTime(51)).toThrowError(
      /simulated asynchronous error/,
    );
  });
});
