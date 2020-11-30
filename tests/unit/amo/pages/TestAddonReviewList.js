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
  SHOW_ALL_REVIEWS,
} from 'amo/pages/AddonReviewList';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import FeaturedAddonReview from 'amo/components/FeaturedAddonReview';
import Page from 'amo/components/Page';
import { getAddonURL } from 'amo/utils';
import { ErrorHandler } from 'core/errorHandler';
import Link from 'amo/components/Link';
import { reviewListURL } from 'amo/reducers/reviews';
import { DEFAULT_API_PAGE_SIZE, createApiError } from 'core/api';
import Paginate from 'core/components/Paginate';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  SET_VIEW_CONTEXT,
} from 'core/constants';
import {
  fetchAddon,
  createInternalAddon,
  loadAddon,
} from 'core/reducers/addons';
import Card from 'ui/components/Card';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import {
  createCapturedErrorHandler,
  createFakeEvent,
  createFakeHistory,
  createFakeLocation,
  createStubErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeI18n,
  fakeReview,
  shallowUntilTarget,
} from 'tests/unit/helpers';

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

  const _loadAddon = (addon = fakeAddon) => {
    store.dispatch(loadAddon({ addon, slug: addon.slug }));
  };

  const _fetchReviews = (params = {}) => {
    return fetchReviews({
      page: '1',
      score: null,
      ...params,
    });
  };

  const _setAddonReviews = ({
    addon = fakeAddon,
    reviews = [{ ...fakeReview, id: 1 }],
    ...params
  } = {}) => {
    const action = setAddonReviews({
      addonSlug: addon.slug,
      page: '1',
      pageSize: DEFAULT_API_PAGE_SIZE,
      reviewCount: reviews.length,
      reviews,
      score: null,
      ...params,
    });
    store.dispatch(action);
  };

  const renderWithAddonAndReviews = ({
    params = {},
    reviews = [
      { ...fakeReview, id: 1, score: 1 },
      { ...fakeReview, id: 2, score: 2 },
    ],
    ...props
  } = {}) => {
    const addonSlug = 'example-slug';
    const addon = { ...fakeAddon, slug: addonSlug };
    _loadAddon(addon);

    _setAddonReviews({ reviews });

    return render({ params: { addonSlug, ...params }, ...props });
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

    it('displays 4 placeholders while loading for an addon with no reviews', () => {
      const externalAddon = {
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          count: 0,
        },
      };
      const addon = createInternalAddon(externalAddon);

      _loadAddon(externalAddon);

      const root = render();

      expect(root.find(AddonReviewCard)).toHaveLength(4);
      root.find(AddonReviewCard).forEach((card) => {
        expect(card).toHaveProp('review', null);
        expect(card).toHaveProp('addon', addon);
      });
    });

    it('displays the same number of placeholders as there are reviews for an addon', () => {
      const reviewCount = 6;
      const externalAddon = {
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          count: reviewCount,
        },
      };
      const addon = createInternalAddon(externalAddon);

      _loadAddon(externalAddon);

      const root = render();

      expect(root.find(AddonReviewCard)).toHaveLength(reviewCount);
      root.find(AddonReviewCard).forEach((card) => {
        expect(card).toHaveProp('review', null);
        expect(card).toHaveProp('addon', addon);
      });
    });

    it('displays 25 placeholders for more than 25 reviews for an addon', () => {
      const externalAddon = {
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          count: DEFAULT_API_PAGE_SIZE + 1,
        },
      };

      _loadAddon(externalAddon);

      const root = render();

      expect(root.find(AddonReviewCard)).toHaveLength(DEFAULT_API_PAGE_SIZE);
    });

    it('renders an AddonSummaryCard with an addon', () => {
      const addon = fakeAddon;
      _loadAddon(addon);
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
      _loadAddon(fakeAddon);
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
      _loadAddon();
      const root = render({
        params: { addonSlug: 'other-slug' },
      });
      expect(root.instance().props.addon).toEqual(null);
    });

    it('fetches reviews if needed', () => {
      const addon = { ...fakeAddon, slug: 'some-other-slug' };
      _loadAddon(addon);
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      render({
        reviews: null,
        errorHandler,
        params: { addonSlug: addon.slug },
      });

      sinon.assert.calledWith(
        dispatch,
        _fetchReviews({
          addonSlug: addon.slug,
          errorHandlerId: errorHandler.id,
        }),
      );
    });

    it('does not fetch reviews if they are already loading', () => {
      const addon = { ...fakeAddon, slug: 'some-other-slug' };
      const errorHandler = createStubErrorHandler();
      _loadAddon(addon);
      store.dispatch(
        _fetchReviews({
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
        _fetchReviews({
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
        _fetchReviews({
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
        errorHandler,
        location: createFakeLocation({ query: { page } }),
        params: { addonSlug },
      });

      sinon.assert.calledWith(
        dispatch,
        _fetchReviews({
          addonSlug,
          errorHandlerId: errorHandler.id,
          page,
        }),
      );
    });

    it('fetches reviews when the page changes', () => {
      const addonSlug = fakeAddon.slug;
      _loadAddon(fakeAddon);
      // Set up loaded data for a different page.
      _setAddonReviews({
        addonSlug,
        page: '3',
        reviews: [fakeReview],
      });
      const dispatch = sinon.spy(store, 'dispatch');

      const page = '2';
      const root = render({
        location: createFakeLocation({ query: { page } }),
        params: { addonSlug },
      });

      sinon.assert.calledWith(
        dispatch,
        _fetchReviews({
          addonSlug,
          page,
          errorHandlerId: root.instance().props.errorHandler.id,
        }),
      );
    });

    it('fetches reviews by score', () => {
      const addon = { ...fakeAddon, slug: 'some-other-slug' };
      _loadAddon(addon);
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      const score = 5;
      render({
        location: createFakeLocation({ query: { score } }),
        errorHandler,
        params: { addonSlug: addon.slug },
      });

      sinon.assert.calledWith(
        dispatch,
        fetchReviews({
          addonSlug: addon.slug,
          errorHandlerId: errorHandler.id,
          score,
        }),
      );
    });

    it('fetches with a null score when score is not in URL', () => {
      const addon = { ...fakeAddon };
      _loadAddon(addon);
      const dispatch = sinon.stub(store, 'dispatch');

      const root = render({
        // Set up a location where ?score= is not present in the URL.
        location: createFakeLocation({ query: {} }),
        params: { addonSlug: addon.slug },
      });

      sinon.assert.calledWith(
        dispatch,
        _fetchReviews({
          addonSlug: addon.slug,
          errorHandlerId: root.instance().props.errorHandler.id,
          score: null,
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
        _fetchReviews({
          addonSlug,
          errorHandlerId: errorHandler.id,
          page,
        }),
      );
    });

    it('fetches reviews when the score changes', () => {
      const addonSlug = fakeAddon.slug;
      _loadAddon(fakeAddon);
      _setAddonReviews({
        addonSlug,
        reviews: [fakeReview],
        score: '4',
      });
      const dispatch = sinon.spy(store, 'dispatch');

      const root = render({
        location: createFakeLocation({ query: { score: '5' } }),
        params: { addonSlug },
      });

      sinon.assert.calledWith(
        dispatch,
        _fetchReviews({
          addonSlug,
          errorHandlerId: root.instance().props.errorHandler.id,
          score: '5',
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
      _loadAddon(addon);
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
      _loadAddon(addon1);
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
      const addon2 = { ...addon1, type: ADDON_TYPE_STATIC_THEME };

      _loadAddon(addon1);
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

    it('passes the errorHandler to the Page component', () => {
      const errorHandler = createCapturedErrorHandler({ status: 404 });

      const root = render({ errorHandler });
      expect(root.find(Page)).toHaveProp('errorHandler', errorHandler);
    });

    it('renders a list of reviews with ratings', () => {
      const addon = { ...fakeAddon };
      const internalAddon = createInternalAddon(addon);
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      _loadAddon(addon);
      _setAddonReviews({ addon, reviews });

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

    it('renders content when no reviews exist', () => {
      const addon = { ...fakeAddon };
      _loadAddon(addon);
      _setAddonReviews({ addon, reviews: [] });

      const root = render();

      expect(root.find(AddonReviewCard)).toHaveLength(0);
      expect(root.find('.AddonReviewList-noReviews')).toHaveLength(1);

      const header = shallow(root.find(Card).prop('header'));
      expect(header).toHaveLength(1);
      expect(
        header.find('.AddonReviewList-filterByScoreSelector'),
      ).toHaveLength(1);
      // We do not want to display "0 review" in the header.
      expect(header.find('.AddonReviewList-reviewCount')).toHaveText('');
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
      _loadAddon({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
      });
      const root = render();

      expect(root.find('.AddonReviewList')).toHaveClassName(
        `AddonReviewList--${ADDON_TYPE_STATIC_THEME}`,
      );
    });

    it('produces an addon URL', () => {
      const addon = fakeAddon;
      _loadAddon(addon);
      expect(render().instance().addonURL()).toEqual(getAddonURL(addon.slug));
    });

    it('requires an addon prop to produce a URL', () => {
      expect(() => render({ addon: null }).instance().addonURL()).toThrowError(
        /cannot access addonURL/,
      );
    });

    it('configures CardList with a count of review results', () => {
      const addon = {
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          // This is the total of all ratings and reviews.
          count: 200,
        },
      };
      _loadAddon(addon);
      // These are the actual review results returned by the API.
      const reviewCount = 5;
      _setAddonReviews({ addon, reviews: Array(reviewCount).fill(fakeReview) });

      const root = render();

      const cardList = root.find('.AddonReviewList-reviews-listing');

      expect(cardList).toHaveProp('header');

      const header = shallow(cardList.prop('header'));
      expect(header.find('.AddonReviewList-reviewCount')).toHaveText(
        `${reviewCount} reviews`,
      );
    });

    it('configures CardList header with LoadingText', () => {
      const addonSlug = 'example-slug';
      const addon = { ...fakeAddon, slug: addonSlug };
      _loadAddon(addon);
      // Set up a state where reviews have not yet been loaded.
      const root = render({ params: { addonSlug } });

      const cardList = root.find('.AddonReviewList-reviews-listing');

      expect(cardList).toHaveProp('header');

      const header = shallow(cardList.prop('header'));
      expect(header.find(LoadingText)).toHaveLength(1);
    });

    describe('with pagination', () => {
      const renderWithPagination = ({
        addon = fakeAddon,
        page = '1',
        reviews = Array(DEFAULT_API_PAGE_SIZE + 2).fill(fakeReview),
        ...otherProps
      } = {}) => {
        _loadAddon(addon);
        _setAddonReviews({ addon, page, reviews });

        return render({
          location: createFakeLocation({ query: { page } }),
          ...otherProps,
        });
      };

      const renderFooter = (root) => {
        return shallow(
          root.find('.AddonReviewList-reviews-listing').prop('footer'),
        );
      };

      it('configures a paginator with the right URL', () => {
        const addonSlug = 'adblock-plus';
        const addon = { ...fakeAddon, id: 8765, slug: addonSlug };
        _loadAddon(addon);
        const root = renderWithPagination({ addon, params: { addonSlug } });

        const paginator = renderFooter(root);

        expect(paginator.instance()).toBeInstanceOf(Paginate);
        expect(paginator).toHaveProp('pathname', reviewListURL({ addonSlug }));
      });

      it('adds UTM query parameters to the reviews URL when there are some', () => {
        const utm_campaign = 'some-utm-campaign';
        const location = createFakeLocation({ query: { utm_campaign } });
        const addonSlug = 'adblock-plus';
        const addon = { ...fakeAddon, id: 8765, slug: addonSlug };
        _loadAddon(addon);

        const root = renderWithPagination({
          addon,
          params: { addonSlug },
          location,
        });

        expect(renderFooter(root)).toHaveProp(
          'pathname',
          `${getAddonURL(addonSlug)}reviews/?utm_campaign=${utm_campaign}`,
        );
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

        const root = renderWithPagination({ page });

        expect(renderFooter(root)).toHaveProp('currentPage', page);
      });
    });

    it('renders an HTML title', () => {
      const addon = fakeAddon;
      _loadAddon(addon);
      const root = render();
      expect(root.find('title')).toHaveText(`Reviews for ${addon.name}`);
    });

    it('does not render an HTML title when there is no add-on', () => {
      const root = render();
      expect(root.find('title')).toHaveLength(0);
    });

    it('does not render a robots meta tag', () => {
      const root = renderWithAddonAndReviews();

      expect(root.find('meta[name="robots"]')).toHaveLength(0);
    });

    it('renders a robots meta tag when there is a featured review', () => {
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];

      const root = renderWithAddonAndReviews({
        reviews,
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
      _loadAddon(addon);
      _setAddonReviews({ reviews: [{ ...fakeReview }] });

      const root = render({ params: { reviewId } });

      const featured = root.find(FeaturedAddonReview);
      expect(featured).toHaveProp('addon', createInternalAddon(addon));
      expect(featured).toHaveProp('reviewId', reviewId);
    });

    it('dispatches fetchReviewPermissions on mount', () => {
      const addon = { ...fakeAddon };
      const userId = 66432;

      _loadAddon(addon);
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

    it('dispatches fetchReviewPermissions on update', () => {
      const addon = { ...fakeAddon };
      const userId = 66432;

      _loadAddon(addon);
      dispatchSignInActions({ store, userId });
      const dispatchSpy = sinon.spy(store, 'dispatch');

      const root = render();
      dispatchSpy.resetHistory();

      root.setProps({ addon });

      sinon.assert.calledWith(
        dispatchSpy,
        fetchReviewPermissions({
          addonId: addon.id,
          errorHandlerId: root.instance().props.errorHandler.id,
          userId,
        }),
      );
    });

    it('does not dispatch fetchReviewPermissions() when an error has occurred', () => {
      const addon = { ...fakeAddon };
      const userId = 66432;

      _loadAddon(addon);
      dispatchSignInActions({ store, userId });

      const error = createApiError({
        response: { status: 401 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'Authentication Failed.' },
      });

      const errorHandler = new ErrorHandler({
        id: 'error-handler-id',
        dispatch: store.dispatch,
      });
      errorHandler.handle(error);

      const dispatchSpy = sinon.spy(store, 'dispatch');

      render({ errorHandler });

      sinon.assert.notCalled(dispatchSpy);
    });

    it('does not dispatch fetchReviewPermissions() if they are already loading', () => {
      const addon = { ...fakeAddon };
      const userId = 66432;

      _loadAddon(addon);
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

    it('does not dispatch fetchReviewPermissions() if they are already loaded', () => {
      const addon = { ...fakeAddon };
      const userId = 66432;

      _loadAddon(addon);
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

      _loadAddon(addon);
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
      _loadAddon(addon);
      _setAddonReviews({ addon, reviews: [{ ...fakeReview }] });
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

  it('renders a "description" meta tag', () => {
    const addonSlug = 'example-slug';
    const addon = { ...fakeAddon, slug: addonSlug };
    _loadAddon(addon);

    const root = render({ params: { addonSlug } });

    expect(root.find('meta[name="description"]')).toHaveLength(1);
    expect(root.find('meta[name="description"]').prop('content')).toMatch(
      new RegExp(
        `Reviews and ratings for ${addon.name}. Find out what other users think about ${addon.name}`,
      ),
    );
  });

  describe('filterByScoreSelector', () => {
    function renderSelector({ preloadAddon = true, ...props } = {}) {
      let addon;
      const addonSlug = 'example-slug';
      if (preloadAddon) {
        addon = { ...fakeAddon, slug: addonSlug };
        _loadAddon(addon);
      }

      const root = render({ params: { addonSlug }, ...props });
      const header = shallow(
        root.find('.AddonReviewList-reviews-listing').prop('header'),
      );

      return {
        addon,
        selector: header.find('.AddonReviewList-filterByScoreSelector'),
      };
    }

    it('disables the selector before the add-on loads', () => {
      const { selector } = renderSelector({ preloadAddon: false });

      expect(selector).toHaveProp('disabled', true);
    });

    it('enables the selector once the add-on loads', () => {
      const { selector } = renderSelector();

      expect(selector).toHaveProp('disabled', false);
    });

    it('lets you select all reviews', () => {
      const history = createFakeHistory();
      const { addon, selector } = renderSelector({ history });

      selector.simulate(
        'change',
        createFakeEvent({
          target: { value: SHOW_ALL_REVIEWS },
        }),
      );

      const listURL = reviewListURL({ addonSlug: addon.slug });

      sinon.assert.calledWith(history.push, `/${lang}/${clientApp}${listURL}`);
    });

    it.each([5, 4, 3, 2, 1])(
      'lets you select only %s star reviews',
      (score) => {
        const history = createFakeHistory();
        const { addon, selector } = renderSelector({ history });

        selector.simulate(
          'change',
          createFakeEvent({
            target: { value: score },
          }),
        );

        const listURL = reviewListURL({ addonSlug: addon.slug, score });

        sinon.assert.calledWith(
          history.push,
          `/${lang}/${clientApp}${listURL}`,
        );
      },
    );

    it('sets the selector to the current score', () => {
      const score = 3;
      const { selector } = renderSelector({
        location: createFakeLocation({ query: { score } }),
      });

      expect(selector).toHaveValue(score);
    });

    it('defaults the selector to showing all reviews', () => {
      const { selector } = renderSelector({
        location: createFakeLocation({ query: {} }),
      });

      expect(selector).toHaveValue(SHOW_ALL_REVIEWS);
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
