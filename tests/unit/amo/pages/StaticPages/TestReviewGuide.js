import {
  createHistory,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render() {
    return defaultRender({
      history: createHistory({
        initialEntries: ['/en-US/review_guide'],
      }),
    });
  }

  it('outputs a review guide page', () => {
    render();

    expect(screen.getByText('Review Guidelines')).toBeInTheDocument();
    expect(
      screen.queryAllByRole('heading', { selector: 'h3' }).length,
    ).toBeGreaterThan(0);
  });
});
