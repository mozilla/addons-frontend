import {
  createHistory,
  getElements,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render() {
    return defaultRender({
      history: createHistory({
        initialEntries: ['/en-US/about'],
      }),
    });
  }

  it('outputs an about page', () => {
    render();

    expect(screen.getByText('About Firefox Add-ons')).toBeInTheDocument();
    expect(getElements('section h2').length).toBeGreaterThan(0);
  });
});
