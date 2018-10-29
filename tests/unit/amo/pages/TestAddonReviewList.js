import { shallow } from 'enzyme';
import * as React from 'react';

import {
  fetchReviews,
  fetchReviewPermissions,
  setAddonReviews,
  setReviewPermissions,
} from 'amo/actions/reviews';
import { setViewContext } from 'amo/actions/viewContext';
import AddonReviewList, {
  AddonReviewListBase,
  extractId,
} from 'amo/pages/AddonReviewList';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import FeaturedAddonReview from 'amo/components/FeaturedAddonReview';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import { DEFAULT_API_PAGE_SIZE, createApiError } from 'core/api';
import Paginate from 'core/components/Paginate';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  CLIENT_APP_FIREFOX,
  SET_VIEW_CONTEXT,
} from 'core/constants';
import {
  fetchAddon,
  createInternalAddon,
  loadAddonResults,
} from 'core/reducers/addons';
import ErrorList from 'ui/components/ErrorList';
import {
  createFakeLocation,
  createStubErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeI18n,
  fakeReview,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { setError } from 'core/actions/errors';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const lang = 'en-US';
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  const getProps = ({
    location = createFakeLocation(),
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

  const loadAddon = (addon = fakeAddon) => {
    store.dispatch(loadAddonResults({ addons: [addon] }));
  };

  const _setAddonReviews = ({
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

  const signInAndSetReviewPermissions = ({
    addonId = fakeAddon.id,
    userId = 12345,
    ...permissions
  } = {}) => {
    dispatchSignInActions({ store, userId });
    store.dispatch(
      setReviewPermissions({
        addonId,
        userId,
        ...permissions,
      }),
    );
  };

  describe('<AddonReviewList/>', () => {
    it('shows placeholders for reviews without an addon', () => {
      const root = render({ addon: null });

      // Make sure four review placeholders were rendered.
      expect(root.find(AddonReviewCard)).toHaveLength(4);
      // Do a sanity check on the first placeholder;
      expect(root.find(AddonReviewCard).at(0)).toHaveProp('addon', null);
      expect(root.find(AddonReviewCard).at(0)).toHaveProp('review', null);
    });

    it('renders an AddonSummaryCard with an addon', () => {
      const addon = fakeAddon;
      loadAddon(addon);
      const root = render();

      const summary = root.find(AddonSummaryCard);
      expect(summary).toHaveProp('addon', createInternalAddon(addon));
      expect(summary).toHaveProp('headerText', `Reviews for ${addon.name}`);
    });

    it('renders an AddonSummaryCard without an addon', () => {
      const root = render();

      const summary = root.find(AddonSummaryCard);
      expect(summary).toHaveProp('addon', null);
      expect(summary).toHaveProp('headerText', '');
    });

    it('does not paginate before reviews have loaded', () => {
      loadAddon(fakeAddon);
      const root = render({ reviews: null });

      expect(root.find(Paginate)).toHaveLength(0);
    });

    it('fetches an addon if requested by slug', () => {
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

    it('does not fetch an addon if it is already loading', () => {
      const addonSlug = 'some-addon-slug';
      const errorHandler = createStubErrorHandler();

      store.dispatch(fetchAddon({ errorHandler, slug: addonSlug }));

      const fakeDispatch = sinon.stub(store, 'dispatch');

      render({
        addon: null,
        errorHandler,
        params: { addonSlug },
      });

      sinon.assert.neverCalledWith(
        fakeDispatch,
        fetchAddon({
          slug: addonSlug,
          errorHandler,
        }),
      );
    });

    it('ignores other add-ons', () => {
      loadAddon();
      const root = render({
        params: { addonSlug: 'other-slug' },
      });
      expect(root.instance().props.addon).toEqual(null);
    });

    it('fetches reviews if needed', () => {
      const addon = { ...fakeAddon, slug: 'some-other-slug' };
      loadAddon(addon);
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

    it('does not fetch reviews if they are already loading', () => {
      const addon = { ...fakeAddon, slug: 'some-other-slug' };
      const errorHandler = createStubErrorHandler();
      loadAddon(addon);
      store.dispatch(
        fetchReviews({
          addonSlug: addon.slug,
          errorHandlerId: errorHandler.id,
        }),
      );
      const dispatch = sinon.stub(store, 'dispatch');

      render({
        reviews: null,
        errorHandler,
        params: { addonSlug: addon.slug },
      });

      sinon.assert.neverCalledWith(
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
      const page = '2';

      render({
        reviews: null,
        errorHandler,
        location: createFakeLocation({ query: { page } }),
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
        location: createFakeLocation({ query: { page } }),
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
        location: createFakeLocation({ query: { page: 2 } }),
        params: { addonSlug },
      });
      dispatch.resetHistory();
      root.setProps({
        location: createFakeLocation({ query: { page: 3 } }),
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
      loadAddon(addon);
      const dispatch = sinon.stub(store, 'dispatch');
      render();

      sinon.assert.calledWith(dispatch, setViewContext(addon.type));
    });

    it('does not dispatch a view context if there is no add-on', () => {
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      render({ errorHandler });

      sinon.assert.neverCalledWithMatch(
        dispatch,
        sinon.match({ type: SET_VIEW_CONTEXT }),
      );
    });

    it('does not dispatch a view context for similar add-ons', () => {
      const addon1 = fakeAddon;
      loadAddon(addon1);
      _setAddonReviews();
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

      loadAddon(addon1);
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
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      loadAddon(addon);
      _setAddonReviews({ reviews });

      const tree = render();

      const items = tree.find(AddonReviewCard);
      expect(items).toHaveLength(2);

      // First review.
      expect(items.at(0)).toHaveProp('addon');
      expect(items.at(0).prop('addon')).toMatchObject(internalAddon);

      expect(items.at(0)).toHaveProp('review');
      expect(items.at(0).prop('review')).toMatchObject({
        score: reviews[0].score,
      });

      // Second review.
      expect(items.at(1)).toHaveProp('addon');
      expect(items.at(1).prop('addon')).toMatchObject(internalAddon);

      expect(items.at(1)).toHaveProp('review');
      expect(items.at(1).prop('review')).toMatchObject({
        score: reviews[1].score,
      });
    });

    it('does not include a review in the listing if the review is also featured', () => {
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      _setAddonReviews({ reviews });

      const root = render({
        params: { reviewId: reviews[0].id.toString() },
      });

      const items = root
        .find('.AddonReviewList-reviews-listing')
        .find(AddonReviewCard);

      expect(items).toHaveLength(1);
      expect(items.at(0).prop('review')).toMatchObject({
        id: reviews[1].id,
      });
    });

    it('does not display a listing if the only review is also featured', () => {
      const reviewId = 1;
      const reviews = [{ ...fakeReview, id: reviewId }];
      _setAddonReviews({ reviews });

      const root = render({
        params: { reviewId: reviewId.toString() },
      });

      expect(root.find('.AddonReviewList-reviews-listing')).toHaveLength(0);
    });

    it('renders a class name with its type', () => {
      loadAddon({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
      });
      const root = render();

      expect(root).toHaveClassName(
        `AddonReviewList--${ADDON_TYPE_STATIC_THEME}`,
      );
    });

    it('produces an addon URL', () => {
      const addon = fakeAddon;
      loadAddon(addon);
      expect(
        render()
          .instance()
          .addonURL(),
      ).toEqual(`/addon/${addon.slug}/`);
    });

    it('produces a URL to itself', () => {
      const addon = fakeAddon;
      loadAddon(addon);
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

    it('configures CardList with a count of text reviews', () => {
      loadAddon({
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          // It has 2 star ratings.
          count: 2,
          // ...but only 1 text review.
          text_count: 1,
        },
      });
      _setAddonReviews();
      const root = render();

      const cardList = root.find('.AddonReviewList-reviews-listing');
      expect(cardList).toHaveProp('header');
      expect(cardList.prop('header')).toContain('1 review for this add-on');
    });

    describe('with pagination', () => {
      const renderWithPagination = ({
        reviews = Array(DEFAULT_API_PAGE_SIZE + 2).fill(fakeReview),
        ...otherProps
      } = {}) => {
        loadAddon();
        _setAddonReviews({ reviews });

        return render(otherProps);
      };

      const renderFooter = (root) => {
        return shallow(
          root.find('.AddonReviewList-reviews-listing').prop('footer'),
        );
      };

      it('configures a paginator with the right URL', () => {
        const root = renderWithPagination();

        const paginator = renderFooter(root);

        expect(paginator.instance()).toBeInstanceOf(Paginate);
        expect(paginator).toHaveProp('pathname', root.instance().url());
      });

      it('configures a paginator with the right Link', () => {
        const root = renderWithPagination();

        expect(renderFooter(root)).toHaveProp('LinkComponent', Link);
      });

      it('configures a paginator with the right review count', () => {
        const reviews = Array(DEFAULT_API_PAGE_SIZE + 2).fill(fakeReview);

        const root = renderWithPagination({ reviews });

        expect(renderFooter(root)).toHaveProp('count', reviews.length);
      });

      it('sets the paginator to page 1 without a query', () => {
        // Render with an empty query string.
        const root = renderWithPagination({ location: createFakeLocation() });

        expect(renderFooter(root)).toHaveProp('currentPage', '1');
      });

      it('sets the paginator to the query string page', () => {
        const page = '3';

        const root = renderWithPagination({
          location: createFakeLocation({ query: { page } }),
        });

        expect(renderFooter(root)).toHaveProp('currentPage', page);
      });
    });

    it('renders an HTML title', () => {
      const addon = fakeAddon;
      loadAddon(addon);
      const root = render();
      expect(root.find('title')).toHaveText(`Reviews for ${addon.name}`);
    });

    it('does not render an HTML title when there is no add-on', () => {
      const root = render();
      expect(root.find('title')).toHaveLength(0);
    });

    it('does not render a robots meta tag', () => {
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      loadAddon(createInternalAddon(fakeAddon));
      _setAddonReviews({ reviews });

      const root = render();

      expect(root.find('meta[name="robots"]')).toHaveLength(0);
    });

    it('renders a robots meta tag when there is a featured review', () => {
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      loadAddon(createInternalAddon(fakeAddon));
      _setAddonReviews({ reviews });

      const root = render({
        params: { reviewId: reviews[0].id.toString() },
      });

      expect(root.find('meta[name="robots"]')).toHaveLength(1);
      expect(root.find('meta[name="robots"]')).toHaveProp(
        'content',
        'noindex, follow',
      );
    });

    it('renders FeaturedAddonReview', () => {
      const reviewId = 8765;
      const addon = { ...fakeAddon };
      loadAddon(addon);
      _setAddonReviews({ reviews: [{ ...fakeReview }] });

      const root = render({ params: { reviewId } });

      const featured = root.find(FeaturedAddonReview);
      expect(featured).toHaveProp('addon', createInternalAddon(addon));
      expect(featured).toHaveProp('reviewId', reviewId);
    });

    it('dispatches fetchReviewPermissions on mount', () => {
      const addon = { ...fakeAddon };
      const userId = 66432;

      loadAddon(addon);
      dispatchSignInActions({ store, userId });
      const dispatchSpy = sinon.spy(store, 'dispatch');

      const root = render();

      sinon.assert.calledWith(
        dispatchSpy,
        fetchReviewPermissions({
          addonId: addon.id,
          errorHandlerId: root.instance().props.errorHandler.id,
          userId,
        }),
      );
    });

    it('does not fetchReviewPermissions if they are already loading', () => {
      const addon = { ...fakeAddon };
      const userId = 66432;

      loadAddon(addon);
      dispatchSignInActions({ store, userId });

      const fetchAction = fetchReviewPermissions({
        addonId: addon.id,
        errorHandlerId: 'any-error-handler',
        userId,
      });
      store.dispatch(fetchAction);

      const dispatchSpy = sinon.spy(store, 'dispatch');

      render();

      sinon.assert.neverCalledWithMatch(dispatchSpy, {
        type: fetchAction.type,
      });
    });

    it('does not fetchReviewPermissions if they are already loaded', () => {
      const addon = { ...fakeAddon };
      const userId = 66432;

      loadAddon(addon);
      signInAndSetReviewPermissions({
        addonId: addon.id,
        userId,
        canReplyToReviews: true,
      });

      const dispatchSpy = sinon.spy(store, 'dispatch');

      render();

      const fetchAction = fetchReviewPermissions({
        addonId: addon.id,
        errorHandlerId: 'any-error-handler',
        userId,
      });
      sinon.assert.neverCalledWithMatch(dispatchSpy, {
        type: fetchAction.type,
      });
    });

    it('sets siteUserCanReply when siteUser has permissions', () => {
      const addon = { ...fakeAddon };
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      const userId = 99654;

      loadAddon(addon);
      _setAddonReviews({ reviews });
      signInAndSetReviewPermissions({
        addonId: addon.id,
        userId,
        canReplyToReviews: true,
      });

      const root = render();

      const items = root.find(AddonReviewCard);
      expect(items).toHaveLength(2);

      expect(items.at(0)).toHaveProp('siteUserCanReply', true);
      expect(items.at(1)).toHaveProp('siteUserCanReply', true);
    });

    it('passes siteUserCanReply to FeaturedAddonReview', () => {
      const reviewId = 8765;
      const addon = { ...fakeAddon };
      loadAddon(addon);
      _setAddonReviews({ reviews: [{ ...fakeReview }] });
      signInAndSetReviewPermissions({
        addonId: addon.id,
        userId: 6745,
        canReplyToReviews: true,
      });

      const root = render({ params: { reviewId } });

      const featured = root.find(FeaturedAddonReview);
      expect(featured).toHaveProp('siteUserCanReply', true);
    });
  });

  describe('extractId', () => {
    it('returns a unique ID based on the addon slug and page', () => {
      const ownProps = getProps({
        params: { addonSlug: 'foobar' },
        location: createFakeLocation({ query: { page: 22 } }),
      });

      expect(extractId(ownProps)).toEqual(`foobar-22`);
    });

    it('returns a unique ID even when there is no page', () => {
      const ownProps = getProps({
        params: { addonSlug: 'foobar' },
        location: createFakeLocation(),
      });

      expect(extractId(ownProps)).toEqual(`foobar-`);
    });
  });
});
