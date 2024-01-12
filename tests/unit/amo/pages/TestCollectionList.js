import { setViewContext } from 'amo/actions/viewContext';
import { CLIENT_APP_FIREFOX, VIEW_CONTEXT_HOME } from 'amo/constants';
import { extractId } from 'amo/pages/CollectionList';
import {
  collectionName,
  fetchUserCollections,
  loadUserCollections,
  FETCH_USER_COLLECTIONS,
} from 'amo/reducers/collections';
import {
  createFakeCollectionDetail,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeI18n,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const userId = 123;
  const lang = 'en-US';
  const location = `/${lang}/${clientApp}/collections/`;
  const errorHandlerId = `src/amo/pages/CollectionList/index.js-${userId}`;
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  const render = () =>
    defaultRender({
      initialEntries: [location],
      store,
    });

  const signInUser = () =>
    dispatchSignInActions({ clientApp, lang, store, userId });

  it('dispatches fetchUserCollections for a logged in user with no collections loaded yet', () => {
    signInUser();
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserCollections({
        errorHandlerId,
        userId,
      }),
    );
  });

  it('does not dispatch fetchUserCollections if there is no user', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: FETCH_USER_COLLECTIONS,
      }),
    );
  });

  it('does not dispatch fetchUserCollections if collections are loading', () => {
    signInUser();
    store.dispatch(fetchUserCollections({ errorHandlerId, userId }));
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: FETCH_USER_COLLECTIONS,
      }),
    );
  });

  it('does not dispatch fetchUserCollections if collections are loaded', () => {
    signInUser();
    store.dispatch(
      loadUserCollections({
        collections: [createFakeCollectionDetail()],
        userId,
      }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: FETCH_USER_COLLECTIONS,
      }),
    );
  });

  it('renders an AuthenticateButton without a logged in user', () => {
    render();

    expect(
      screen.getByRole('link', { name: 'Log in to view your collections' }),
    ).toBeInTheDocument();
  });

  it('does not render an AuthenticateButton with a logged in user', () => {
    signInUser();
    render();

    expect(
      screen.queryByRole('link', { name: 'Log in to view your collections' }),
    ).not.toBeInTheDocument();
  });

  it('renders the collection listing info card', () => {
    signInUser();
    render();

    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(
      screen.getByText(
        `Collections make it easy to keep track of favorite add-ons and ` +
          `share your perfectly customized browser with others.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Create a collection' }),
    ).toHaveAttribute('href', `/${lang}/${clientApp}/collections/add/`);
  });

  it('renders placeholder text if the user has no collections', () => {
    signInUser();
    store.dispatch(loadUserCollections({ collections: [], userId }));
    render();

    expect(screen.getByText('My collections')).toBeInTheDocument();
    expect(
      screen.getByText('You do not have any collections.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByClassName('CollectionList-listing'),
    ).not.toBeInTheDocument();
  });

  it('renders loading UserCollection objects if collections are loading', () => {
    signInUser();
    store.dispatch(fetchUserCollections({ errorHandlerId, userId }));
    render();

    expect(
      screen.queryByText('You do not have any collections.'),
    ).not.toBeInTheDocument();

    // Expect four placeholder collections with two LoadingText each.
    expect(
      within(screen.getByClassName('CollectionList-listing')).getAllByRole(
        'alert',
      ),
    ).toHaveLength(8);
  });

  it('renders a list of collections', () => {
    const name1 = 'collection1';
    const name2 = 'collection2';
    const slug1 = 'collection-1';
    const slug2 = 'collection-2';
    const collections = [
      createFakeCollectionDetail({
        addon_count: 1,
        authorId: userId,
        id: 1,
        name: name1,
        slug: slug1,
      }),
      createFakeCollectionDetail({
        addon_count: 2,
        authorId: userId,
        id: 2,
        name: name2,
        slug: slug2,
      }),
    ];
    signInUser();
    store.dispatch(loadUserCollections({ collections, userId }));
    render();

    // The accessible name for the link is the collection name plus the number
    // of add-ons.
    expect(
      screen.getByRole('link', { name: `${name1} 1 add-on` }),
    ).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/collections/${userId}/${slug1}/`,
    );
    expect(screen.getByRole('heading', { name: name1 })).toBeInTheDocument();
    expect(screen.getByText('1 add-on')).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: `${name2} 2 add-ons` }),
    ).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/collections/${userId}/${slug2}/`,
    );
    expect(screen.getByRole('heading', { name: name2 })).toBeInTheDocument();
    expect(screen.getByText('2 add-ons')).toBeInTheDocument();
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on currentUserId', () => {
      expect(extractId({ currentUserId: userId })).toEqual(userId);
    });

    it('returns a blank ID with no currentUserId', () => {
      expect(extractId({})).toEqual('');
    });
  });

  it('dispatches setViewContext when component mounts', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(setViewContext(VIEW_CONTEXT_HOME));
  });

  describe('Tests for UserCollection', () => {
    it('can render a collection with a null for a name', () => {
      const collections = [
        createFakeCollectionDetail({ authorId: userId, name: null }),
      ];
      signInUser();
      store.dispatch(loadUserCollections({ collections, userId }));
      render();

      expect(
        screen.getByRole('heading', {
          name: collectionName({ name: null, jed: fakeI18n() }),
        }),
      ).toBeInTheDocument();
    });

    it('can render a collection that is loading', () => {
      const collections = [
        createFakeCollectionDetail({
          authorId: userId,
          // When a collection is in a loading state, numberOfAddons is null.
          addon_count: null,
        }),
      ];
      signInUser();
      store.dispatch(loadUserCollections({ collections, userId }));
      render();

      expect(
        within(screen.getByClassName('UserCollection-name')).getByRole('alert'),
      ).toBeInTheDocument();
      expect(
        within(screen.getByClassName('UserCollection-number')).getByRole(
          'alert',
        ),
      ).toBeInTheDocument();
    });
  });
});
