import {
  createHistory,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  it('renders an UnavailableForLegalReasons Page', () => {
    defaultRender({
      history: createHistory({
        initialEntries: ['/en-US/firefox/451/'],
      }),
    });

    expect(
      screen.getByText('That page is not available in your region'),
    ).toBeInTheDocument();

    expect(
      screen.getByTextAcrossTags(
        'You may be able to find what you’re looking for in one of the available extensions or themes, or by asking for help on our community forums.',
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'extensions' })).toHaveAttribute(
      'href',
      '/en-US/firefox/extensions/',
    );
    expect(screen.getByRole('link', { name: 'themes' })).toHaveAttribute(
      'href',
      '/en-US/firefox/themes/',
    );
    expect(
      screen.getByRole('link', { name: 'community forums' }),
    ).toHaveAttribute('href', expect.stringContaining('discourse'));
  });
});
