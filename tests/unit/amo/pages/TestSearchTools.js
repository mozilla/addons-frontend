import { sendServerRedirect } from 'amo/reducers/redirectTo';
import {
  dispatchClientMetadata,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ store } = {}) =>
    defaultRender({
      initialEntries: ['/en-US/android/search-tools/'],
      store,
    });

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
    // Once for the post-render LOCATION_CHANGE from the render helper.
    expect(fakeDispatch).toHaveBeenCalledTimes(3);
  });

  it('renders a NotFoundPage', () => {
    render();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });
});
