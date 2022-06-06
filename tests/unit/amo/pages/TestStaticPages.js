import { renderPage as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  function render({ location }) {
    return defaultRender({ initialEntries: [location] });
  }

  it('outputs the about page', () => {
    render({ location: '/en-US/about' });

    expect(screen.getByText('About Firefox Add-ons')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'A community of creators' }),
    ).toBeInTheDocument();
  });

  it('outputs the review guide page', () => {
    render({ location: '/en-US/review_guide' });

    expect(screen.getByText('Review Guidelines')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Frequently Asked Questions about Reviews',
      }),
    ).toBeInTheDocument();
  });
});
