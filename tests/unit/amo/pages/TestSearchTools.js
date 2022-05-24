import { sendServerRedirect } from 'amo/reducers/redirectTo';
import {
  createHistory,
  dispatchClientMetadata,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ store } = {}) => {
    defaultRender({
      history: createHistory({
        initialEntries: ['/en-US/android/search-tools/'],
      }),
      store,
    });
  };

  it('sends a server redirect to support old search tool URLs', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = jest.spyOn(store, 'dispatch');

    render({ store });

    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: '/en-US/android/extensions/category/search-tools/',
      }),
    );
    // Once for the initial LOCATION_CHANGE.
    // Once for the redirect.
    expect(fakeDispatch).toHaveBeenCalledTimes(2);
  });

  it('renders a NotFoundPage', () => {
    render();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });
});
