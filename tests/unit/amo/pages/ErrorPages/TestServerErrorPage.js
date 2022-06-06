import config from 'config';

import {
  getMockConfig,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

jest.mock('config');

describe(__filename, () => {
  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  const render = () =>
    defaultRender({ initialEntries: ['/en-US/firefox/500/'] });

  it('renders a ServerError page in development', () => {
    const fakeConfig = getMockConfig({ isDevelopment: true });
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });

    render();

    expect(screen.getByText('Server Error')).toBeInTheDocument();

    expect(
      screen.getByTextAcrossTags(
        `If you have additional information that would help us you can file an issue. ` +
          `Tell us what steps you took that lead to the error and we'll do our best to fix it.`,
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'file an issue' })).toHaveAttribute(
      'href',
      'https://github.com/mozilla/addons-frontend/issues/new/',
    );
  });

  it('renders Suggested Pages', () => {
    const fakeConfig = getMockConfig({ isDevelopment: true });
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });

    render();

    expect(
      screen.getByRole('heading', { name: 'Suggested Pages' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: 'Browse all extensions' }),
    ).toHaveAttribute('href', '/en-US/firefox/extensions/');
    expect(
      screen.getByRole('link', { name: 'Browse all themes' }),
    ).toHaveAttribute('href', '/en-US/firefox/themes/');
    expect(
      screen.getByRole('link', { name: 'Add-ons Home Page' }),
    ).toHaveAttribute('href', '/en-US/firefox/');
  });

  it('renders a NotFound page when not in development', () => {
    const fakeConfig = getMockConfig({ isDevelopment: false });
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });

    render();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });
});
