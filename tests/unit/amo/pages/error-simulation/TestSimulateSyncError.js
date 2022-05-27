import { renderPage, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  it('throws a simulated error', () => {
    renderPage({ initialEntries: ['/en-US/firefox/simulate-sync-error/'] });

    expect(screen.getByText('Server Error')).toBeInTheDocument();
  });
});
