import { shallow } from 'enzyme';
import * as React from 'react';

import fallbackIcon from 'amo/img/icons/default-64.png';
import {
  clearAddonReviews,
  fetchReviews,
  setAddonReviews,
} from 'amo/actions/reviews';
import { setViewContext } from 'amo/actions/viewContext';
import AddonReviewList, {
  AddonReviewListBase,
  extractId,
} from 'amo/components/AddonReviewList';
import AddonReviewListItem from 'amo/components/AddonReviewListItem';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import RatingManager from 'amo/components/RatingManager';
import { DEFAULT_API_PAGE_SIZE, createApiError } from 'core/api';
import Paginate from 'core/components/Paginate';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
import {
  fetchAddon,
  createInternalAddon,
  loadAddons,
} from 'core/reducers/addons';
import ErrorList from 'ui/components/ErrorList';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeReview,
} from 'tests/unit/amo/helpers';
import {
  createFetchAddonResult,
  createStubErrorHandler,
  fakeI18n,
  createFakeHistory,
  fakeRouterLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { setError } from 'core/actions/errors';
import LoadingText from 'ui/components/LoadingText';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const lang = 'en-US';
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  const getProps = ({
    location = fakeRouterLocation(),
    params,
    ...customProps
  } = {}) => {
    return {
      i18n: fakeI18n(),
      location,
      match: {
        params: {
          addonSlug: fakeAddon.slug,
          ...params,
        },
      },
      store,
      ...customProps,
    };
  };

  const render = ({ ...customProps } = {}) => {
    const props = getProps(customProps);

    return shallowUntilTarget(
      <AddonReviewList {...props} />,
      AddonReviewListBase,
    );
  };

  const dispatchAddon = (addon = fakeAddon) => {
    store.dispatch(loadAddons(createFetchAddonResult(addon).entities));
  };

  const dispatchAddonReviews = ({
    addon = fakeAddon,
    reviews = [{ ...fakeReview, id: 1 }],
  } = {}) => {
    const action = setAddonReviews({
      addonSlug: addon.slug,
      pageSize: DEFAULT_API_PAGE_SIZE,
      reviewCount: reviews.length,
      reviews,
    });
    store.dispatch(action);
  };

  describe('<AddonReviewList/>', () => {
    it('requires location params', () => {
      expect(() => render({ match: null })).toThrowError(
        /component had a falsey match\.params\.addonSlug/,
      );
    });

    it('requires an addonSlug param', () => {
      expect(() => render({ match: { params: {} } })).toThrowError(
        /component had a falsey match\.params\.addonSlug/,
      );
    });

    it('requires a non-empty addonSlug param', () => {
      expect(() =>
        render({ match: { params: { addonSlug: null } } }),
      ).toThrowError(/component had a falsey match\.params\.addonSlug/);
    });

    it('waits for an addon and reviews to load', () => {
      const location = fakeRouterLocation();
      const root = render({ addon: null, location });
      expect(root.find('.AddonReviewList-header-icon img').prop('src')).toEqual(
        fallbackIcon,
      );
      expect(
        root.find('.AddonReviewList-header-text').find(LoadingText),
      ).toHaveLength(3);

      // Make sure four review placeholders were rendered.
      expect(root.find(AddonReviewListItem)).toHaveLength(4);
      // Do a sanity check on the first placeholder;
      expect(root.find(AddonReviewListItem).at(0)).toHaveProp('addon', null);
      expect(root.find(AddonReviewListItem).at(0)).toHaveProp(
        'location',
        location,
      );
      expect(root.find(AddonReviewListItem).at(0)).toHaveProp('review', null);
    });

    it('does not paginate before reviews have loaded', () => {
      dispatchAddon(fakeAddon);
      const root = render({ reviews: null });

      expect(root.find(Paginate)).toHaveLength(0);
    });

    it('fetches an addon if needed', () => {
      const addonSlug = 'some-addon-slug';
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      render({
        addon: null,
        errorHandler,
        params: { addonSlug },
      });

      sinon.assert.calledWith(
        dispatch,
        fetchAddon({
          slug: addonSlug,
          errorHandler,
        }),
      );
    });

    it('ignores other add-ons', () => {
      dispatchAddon();
      const root = render({
        params: { addonSlug: 'other-slug' },
      });
      expect(root.instance().props.addon).toEqual(null);
    });

    it('fetches reviews if needed', () => {
      const addon = { ...fakeAddon, slug: 'some-other-slug' };
      dispatchAddon(addon);
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      render({
        reviews: null,
        errorHandler,
        params: { addonSlug: addon.slug },
      });

      sinon.assert.calledWith(
        dispatch,
        fetchReviews({
          addonSlug: addon.slug,
          errorHandlerId: errorHandler.id,
        }),
      );
    });

    it('fetches reviews if needed during an update', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        slug: 'some-other-slug',
      });
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      const root = render({
        addon: null,
        reviews: null,
        errorHandler,
        params: { addonSlug: addon.slug },
      });

      dispatch.resetHistory();
      // Simulate how a redux state change will introduce an addon.
      root.setProps({ addon });

      sinon.assert.calledWith(
        dispatch,
        fetchReviews({
          addonSlug: addon.slug,
          errorHandlerId: errorHandler.id,
        }),
      );
    });

    it('fetches reviews by page', () => {
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      const addonSlug = fakeAddon.slug;
      const page = 2;

      render({
        reviews: null,
        errorHandler,
        location: fakeRouterLocation({ query: { page } }),
        params: { addonSlug },
      });

      sinon.assert.calledWith(
        dispatch,
        fetchReviews({
          addonSlug,
          errorHandlerId: errorHandler.id,
          page,
        }),
      );
    });

    it('dispatches fetchReviews with an invalid page variable', () => {
      // We intentionally pass invalid pages to the API to get a 404 response.
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      const addonSlug = fakeAddon.slug;
      const page = 'x';

      render({
        errorHandler,
        location: fakeRouterLocation({ query: { page } }),
        params: { addonSlug },
      });

      sinon.assert.calledWith(
        dispatch,
        fetchReviews({
          addonSlug,
          errorHandlerId: errorHandler.id,
          page,
        }),
      );
    });

    it('fetches reviews when the page changes', () => {
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      const addonSlug = fakeAddon.slug;

      const root = render({
        errorHandler,
        location: fakeRouterLocation({ query: { page: 2 } }),
        params: { addonSlug },
      });
      dispatch.resetHistory();
      root.setProps({
        location: fakeRouterLocation({ query: { page: 3 } }),
      });

      sinon.assert.calledWith(
        dispatch,
        fetchReviews({
          addonSlug,
          errorHandlerId: errorHandler.id,
          page: 3,
        }),
      );
    });

    it('does not fetch an addon if there is an error', () => {
      const addon = { ...fakeAddon, slug: 'some-other-slug' };
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler(new Error('some error'));

      render({
        addon: null,
        errorHandler,
        params: { addonSlug: addon.slug },
      });

      sinon.assert.notCalled(dispatch);
    });

    it('does not fetch reviews if there is an error', () => {
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler(new Error('some error'));

      render({
        reviews: null,
        errorHandler,
      });

      sinon.assert.notCalled(dispatch);
    });

    it('dispatches a view context for the add-on', () => {
      const addon = fakeAddon;
      dispatchAddon(addon);
      const dispatch = sinon.stub(store, 'dispatch');
      render();

      sinon.assert.calledWith(dispatch, setViewContext(addon.type));
    });

    it('does not dispatch a view context for similar add-ons', () => {
      const addon1 = fakeAddon;
      dispatchAddon(addon1);
      dispatchAddonReviews();
      const dispatch = sinon.stub(store, 'dispatch');
      const root = render();

      dispatch.resetHistory();
      // Update the component with a different addon having the same type.
      root.setProps({
        addon: createInternalAddon({ ...addon1, id: 345 }),
      });

      sinon.assert.notCalled(dispatch);
    });

    it('dispatches a view context for new add-on types', () => {
      const addon1 = { ...fakeAddon, type: ADDON_TYPE_EXTENSION };
      const addon2 = { ...addon1, type: ADDON_TYPE_THEME };

      dispatchAddon(addon1);
      const dispatch = sinon.stub(store, 'dispatch');
      const root = render();

      dispatch.resetHistory();
      root.setProps({ addon: createInternalAddon(addon2) });

      sinon.assert.calledWith(dispatch, setViewContext(addon2.type));
    });

    it('renders an error', () => {
      const errorHandler = createStubErrorHandler(new Error('some error'));

      const root = render({ errorHandler });
      expect(root.find(ErrorList)).toHaveLength(1);
    });

    it('renders NotFound page if API returns 401 error', () => {
      const id = 'error-handler-id';

      const error = createApiError({
        response: { status: 401 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'Authentication Failed.' },
      });
      store.dispatch(setError({ id, error }));
      const capturedError = store.getState().errors[id];
      // This makes sure the error was dispatched to state correctly.
      expect(capturedError).toBeTruthy();

      const errorHandler = createStubErrorHandler(capturedError);

      const root = render({ errorHandler });
      expect(root.find(NotFound)).toHaveLength(1);
    });

    it('renders NotFound page if API returns 403 error', () => {
      const id = 'error-handler-id';

      const error = createApiError({
        response: { status: 403 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'Not Permitted.' },
      });
      store.dispatch(setError({ id, error }));
      const capturedError = store.getState().errors[id];
      // This makes sure the error was dispatched to state correctly.
      expect(capturedError).toBeTruthy();

      const errorHandler = createStubErrorHandler(capturedError);

      const root = render({ errorHandler });
      expect(root.find(NotFound)).toHaveLength(1);
    });

    it('renders NotFound page if API returns 404 error', () => {
      const id = 'error-handler-id';

      const error = createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'Not Found.' },
      });
      store.dispatch(setError({ id, error }));
      const capturedError = store.getState().errors[id];
      // This makes sure the error was dispatched to state correctly.
      expect(capturedError).toBeTruthy();

      const errorHandler = createStubErrorHandler(capturedError);

      const root = render({ errorHandler });
      expect(root.find(NotFound)).toHaveLength(1);
    });

    it('renders a list of reviews with ratings', () => {
      const addon = fakeAddon;
      const internalAddon = createInternalAddon(addon);
      const reviews = [
        { ...fakeReview, id: 1, rating: 1 },
        { ...fakeReview, id: 2, rating: 2 },
      ];
      dispatchAddon(addon);
      dispatchAddonReviews({ reviews });

      const tree = render();

      const items = tree.find(AddonReviewListItem);
      expect(items).toHaveLength(2);

      // First review.
      expect(items.at(0)).toHaveProp('addon');
      expect(items.at(0).prop('addon')).toMatchObject(internalAddon);

      expect(items.at(0)).toHaveProp('review');
      expect(items.at(0).prop('review')).toMatchObject({
        rating: reviews[0].rating,
      });

      // Second review.
      expect(items.at(1)).toHaveProp('addon');
      expect(items.at(1).prop('addon')).toMatchObject(internalAddon);

      expect(items.at(1)).toHaveProp('review');
      expect(items.at(1).prop('review')).toMatchObject({
        rating: reviews[1].rating,
      });
    });

    it("renders the add-on's icon in the header", () => {
      const addon = fakeAddon;
      dispatchAddon(addon);
      const root = render();
      const img = root.find('.AddonReviewList-header-icon img');
      expect(img).toHaveProp('src', addon.icon_url);
    });

    it('renders a class name with its type', () => {
      dispatchAddon({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
      });
      const root = render();

      expect(root).toHaveClassName(
        `AddonReviewList--${ADDON_TYPE_STATIC_THEME}`,
      );
    });

    it('renders the fallback icon if the origin is not allowed', () => {
      dispatchAddon({
        ...fakeAddon,
        icon_url: 'http://foo.com/hax.png',
      });
      const root = render();
      const img = root.find('.AddonReviewList-header-icon img');
      expect(img).toHaveProp('src', fallbackIcon);
    });

    it('renders a hidden h1 for SEO', () => {
      const addon = fakeAddon;
      dispatchAddon(addon);
      const root = render();
      const h1 = root.find('.AddonReviewList-header h1');
      expect(h1).toHaveClassName('visually-hidden');
      expect(h1).toHaveText(`Reviews for ${addon.name}`);
    });

    it('produces an addon URL', () => {
      const addon = fakeAddon;
      dispatchAddon(addon);
      expect(
        render()
          .instance()
          .addonURL(),
      ).toEqual(`/addon/${addon.slug}/`);
    });

    it('produces a URL to itself', () => {
      const addon = fakeAddon;
      dispatchAddon(addon);
      expect(
        render()
          .instance()
          .url(),
      ).toEqual(`/addon/${addon.slug}/reviews/`);
    });

    it('requires an addon prop to produce a URL', () => {
      expect(() =>
        render({ addon: null })
          .instance()
          .addonURL(),
      ).toThrowError(/cannot access addonURL/);
    });

    it('renders author names without links if no URLs', () => {
      const addon = {
        ...fakeAddon,
        authors: [
          {
            name: 'Hayley',
            url: null,
          },
        ],
      };
      dispatchAddon(addon);
      const root = render();

      const h3 = root.find('.AddonReviewList-header-authors');

      expect(h3.render().text()).toEqual('by Hayley');
      expect(h3.render().find('a')).toHaveLength(0);
    });

    it('renders author names with URLs if they exist', () => {
      const addon = {
        ...fakeAddon,
        authors: [
          {
            name: 'Chantal',
            url: 'http://www.carolynmark.com/',
          },
          {
            name: 'Leroy',
            url: 'http://www.carolynmark.com/',
          },
        ],
      };
      dispatchAddon(addon);
      const root = render();

      const h3 = root.find('.AddonReviewList-header-authors');

      expect(h3.render().text()).toEqual('by Chantal, Leroy');
      expect(h3.render().find('a')).toHaveLength(2);
    });

    it('configures CardList with a count of text reviews', () => {
      dispatchAddon({
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          // It has 2 star ratings.
          count: 2,
          // ...but only 1 text review.
          text_count: 1,
        },
      });
      dispatchAddonReviews();
      const root = render();

      const cardList = root.find('.AddonReviewList-reviews');
      expect(cardList).toHaveProp('header');
      expect(cardList.prop('header')).toContain('1 review for this add-on');
    });

    describe('with pagination', () => {
      const renderWithPagination = ({
        reviews = Array(DEFAULT_API_PAGE_SIZE + 2).fill(fakeReview),
        ...otherProps
      } = {}) => {
        dispatchAddon();
        dispatchAddonReviews({ reviews });

        return render(otherProps);
      };

      it('configures a paginator with the right URL', () => {
        const root = renderWithPagination();

        const footer = root.find('.AddonReviewList-reviews').prop('footer');
        const paginator = shallow(footer);

        expect(paginator.instance()).toBeInstanceOf(Paginate);
        expect(paginator).toHaveProp('pathname', root.instance().url());
      });

      it('configures a paginator with the right Link', () => {
        const root = renderWithPagination();

        const footer = root.find('.AddonReviewList-reviews').prop('footer');
        // `footer` contains a paginator
        expect(shallow(footer)).toHaveProp('LinkComponent', Link);
      });

      it('configures a paginator with the right review count', () => {
        const reviews = Array(DEFAULT_API_PAGE_SIZE + 2).fill(fakeReview);

        const root = renderWithPagination({ reviews });

        const footer = root.find('.AddonReviewList-reviews').prop('footer');
        // `footer` contains a paginator
        expect(shallow(footer)).toHaveProp('count', reviews.length);
      });

      it('sets the paginator to page 1 without a query', () => {
        // Render with an empty query string.
        const root = renderWithPagination({ location: fakeRouterLocation() });

        const footer = root.find('.AddonReviewList-reviews').prop('footer');
        // `footer` contains a paginator
        expect(shallow(footer)).toHaveProp('currentPage', 1);
      });

      it('sets the paginator to the query string page', () => {
        const page = 3;

        const root = renderWithPagination({
          location: fakeRouterLocation({ query: { page } }),
        });

        const footer = root.find('.AddonReviewList-reviews').prop('footer');
        // `footer` contains a paginator
        expect(shallow(footer)).toHaveProp('currentPage', page);
      });
    });

    it('renders an HTML title', () => {
      const addon = fakeAddon;
      dispatchAddon(addon);
      const root = render();
      expect(root.find('title')).toHaveText(`Reviews for ${addon.name}`);
    });

    it('does not render an HTML title when there is no add-on', () => {
      const root = render();
      expect(root.find('title')).toHaveLength(0);
    });

    it('configures a rating manager', () => {
      dispatchAddon(fakeAddon);
      const location = fakeRouterLocation();
      const root = render({ reviews: null, location });

      const manager = root.find(RatingManager);
      expect(manager).toHaveLength(1);

      const instanceProps = root.instance().props;
      expect(manager).toHaveProp('addon', instanceProps.addon);
      expect(manager).toHaveProp('location', location);
      expect(manager).toHaveProp(
        'version',
        instanceProps.addon.current_version,
      );
      expect(manager).toHaveProp('onReviewSubmitted');
    });

    it('does not render a rating manager without a version', () => {
      dispatchAddon({ ...fakeAddon, current_version: null });
      const root = render();

      expect(root.find(RatingManager)).toHaveLength(0);
    });

    it('handles a submitted review', () => {
      const addonSlug = 'some-slug';
      dispatchAddon({ ...fakeAddon, slug: addonSlug });
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = render({ reviews: null, params: { addonSlug } });

      const manager = root.find(RatingManager);
      expect(manager).toHaveProp('onReviewSubmitted');
      const onReviewSubmitted = manager.prop('onReviewSubmitted');

      // Simulate a review submission.
      onReviewSubmitted();

      sinon.assert.calledWith(dispatchSpy, clearAddonReviews({ addonSlug }));
    });

    it('resets the page after submitting a review', () => {
      const history = createFakeHistory();
      const props = {
        history,
        location: fakeRouterLocation({
          query: { page: 2 },
        }),
        params: {
          addonSlug: fakeAddon.slug,
        },
        reviews: null,
      };

      dispatchAddon({ ...fakeAddon });

      const root = render(props);

      const manager = root.find(RatingManager);
      expect(manager).toHaveProp('onReviewSubmitted');
      const onReviewSubmitted = manager.prop('onReviewSubmitted');

      // Simulate a review submission.
      onReviewSubmitted();

      sinon.assert.calledWith(history.push, {
        pathname: `/${lang}/${clientApp}${root.instance().url()}`,
        query: { page: 1 },
      });
    });
  });

  describe('extractId', () => {
    it('returns a unique ID based on the addon slug and page', () => {
      const ownProps = getProps({
        params: { addonSlug: 'foobar' },
        location: fakeRouterLocation({ query: { page: 22 } }),
      });

      expect(extractId(ownProps)).toEqual(`foobar-22`);
    });

    it('returns a unique ID even when there is no page', () => {
      const ownProps = getProps({
        params: { addonSlug: 'foobar' },
        location: fakeRouterLocation(),
      });

      expect(extractId(ownProps)).toEqual(`foobar-`);
    });
  });
});
