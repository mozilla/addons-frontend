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
    defaultRender({ initialEntries: ['/en-US/firefox/401/'] });

  it('renders a NotAuthorized page in development', () => {
    const fakeConfig = getMockConfig({ isDevelopment: true });
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });

    render();

    expect(screen.getByText('Not Authorized')).toBeInTheDocument();

    expect(
      screen.getByTextAcrossTags(
        `If you are signed in and think this message is an error, please file an issue. ` +
          `Tell us where you came from and what you were trying to access, and we'll fix the issue.`,
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'file an issue' })).toHaveAttribute(
      'href',
      'https://github.com/mozilla/addons-frontend/issues/new/',
    );

    // This should render the SuggestedPages component.
    expect(
      screen.getByRole('heading', { name: 'Suggested Pages' }),
    ).toBeInTheDocument();
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
