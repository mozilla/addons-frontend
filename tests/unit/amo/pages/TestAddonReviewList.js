import { shallow } from 'enzyme';
import * as React from 'react';

import fallbackIcon from 'amo/img/icons/default-64.png';
import { fetchReviews, setAddonReviews } from 'amo/actions/reviews';
import { setViewContext } from 'amo/actions/viewContext';
import AddonReviewList, {
  AddonReviewListBase,
  extractId,
} from 'amo/pages/AddonReviewList';
import AddonReviewCard from 'amo/components/AddonReviewCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import RatingsByStar from 'amo/components/RatingsByStar';
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
  createFakeLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { setError } from 'core/actions/errors';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';

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

  const getAddonHeader = (root) => {
    return shallow(root.find('.AddonReviewList-addon').prop('header'));
  };

  const renderAddonHeader = ({ addon = { ...fakeAddon } } = {}) => {
    dispatchAddon(addon);
    const root = render();
    return getAddonHeader(root);
  };

  describe('<AddonReviewList/>', () => {
    it('waits for an addon and reviews to load', () => {
      const root = render({ addon: null });
      const header = getAddonHeader(root);

      expect(header.find('.AddonReviewList-header-icon img')).toHaveProp(
        'src',
        fallbackIcon,
      );
      expect(
        header.find('.AddonReviewList-header-text').find(LoadingText),
      ).toHaveLength(3);

      // Make sure four review placeholders were rendered.
      expect(root.find(AddonReviewCard)).toHaveLength(4);
      // Do a sanity check on the first placeholder;
      expect(root.find(AddonReviewCard).at(0)).toHaveProp('addon', null);
      expect(root.find(AddonReviewCard).at(0)).toHaveProp('review', null);
    });

    it('does not paginate before reviews have loaded', () => {
      dispatchAddon(fakeAddon);
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

    it('does not fetch reviews if they are already loading', () => {
      const addon = { ...fakeAddon, slug: 'some-other-slug' };
      const errorHandler = createStubErrorHandler();
      dispatchAddon(addon);
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
      const page = 2;

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
      dispatchAddon(addon);
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
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      dispatchAddon(addon);
      dispatchAddonReviews({ reviews });

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
      dispatchAddonReviews({ reviews });

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
      dispatchAddonReviews({ reviews });

      const root = render({
        params: { reviewId: reviewId.toString() },
      });

      expect(root.find('.AddonReviewList-reviews-listing')).toHaveLength(0);
    });

    it("renders the add-on's icon in the header", () => {
      const addon = { ...fakeAddon };
      const header = renderAddonHeader({ addon });
      const img = header.find('.AddonReviewList-header-icon img');

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
      const addon = {
        ...fakeAddon,
        icon_url: 'http://foo.com/hax.png',
      };
      const header = renderAddonHeader({ addon });
      const img = header.find('.AddonReviewList-header-icon img');

      expect(img).toHaveProp('src', fallbackIcon);
    });

    it('renders a hidden h1 for SEO', () => {
      const addon = { ...fakeAddon };
      const header = renderAddonHeader({ addon });
      const h1 = header.find('.AddonReviewList-header h1');
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
      const name = 'Hayley';
      const addon = {
        ...fakeAddon,
        authors: [
          {
            name,
            url: null,
          },
        ],
      };
      const header = renderAddonHeader({ addon });
      const h3 = header.find('.AddonReviewList-header-authors').render();

      expect(h3.text()).toEqual(`by ${name}`);
      expect(h3.find('a')).toHaveLength(0);
    });

    it('renders author names with URLs if they exist', () => {
      const name1 = 'Chantal';
      const name2 = 'Leroy';
      const addon = {
        ...fakeAddon,
        authors: [
          {
            name: name1,
            url: 'http://www.carolynmark.com/',
          },
          {
            name: name2,
            url: 'http://www.carolynmark.com/',
          },
        ],
      };
      const header = renderAddonHeader({ addon });
      const h3 = header.find('.AddonReviewList-header-authors').render();

      expect(h3.text()).toEqual(`by ${name1}, ${name2}`);
      expect(h3.find('a')).toHaveLength(2);
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

      const cardList = root.find('.AddonReviewList-reviews-listing');
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

        expect(renderFooter(root)).toHaveProp('currentPage', 1);
      });

      it('sets the paginator to the query string page', () => {
        const page = 3;

        const root = renderWithPagination({
          location: createFakeLocation({ query: { page } }),
        });

        expect(renderFooter(root)).toHaveProp('currentPage', page);
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

    it('does not render a robots meta tag', () => {
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      dispatchAddon(createInternalAddon(fakeAddon));
      dispatchAddonReviews({ reviews });

      const root = render();

      expect(root.find('meta[name="robots"]')).toHaveLength(0);
    });

    it('renders a robots meta tag when there is a featured review', () => {
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      dispatchAddon(createInternalAddon(fakeAddon));
      dispatchAddonReviews({ reviews });

      const root = render({
        params: { reviewId: reviews[0].id.toString() },
      });

      expect(root.find('meta[name="robots"]')).toHaveLength(1);
      expect(root.find('meta[name="robots"]')).toHaveProp(
        'content',
        'noindex, follow',
      );
    });
  });

  describe('overallRatingStars', () => {
    it('renders Rating without an add-on', () => {
      const root = render({ addon: null });
      const rating = root.find(Rating);

      expect(rating).toHaveProp('rating', null);
    });

    it('renders Rating without add-on ratings', () => {
      const addon = { ...fakeAddon, ratings: undefined };
      dispatchAddon(addon);
      const root = render();
      const rating = root.find(Rating);

      expect(rating).toHaveProp('rating', undefined);
    });

    it('renders Rating with add-on ratings', () => {
      const addon = {
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          average: 4.5,
        },
      };
      dispatchAddon(addon);
      const root = render();
      const rating = root.find(Rating);

      expect(rating).toHaveProp('rating', addon.ratings.average);
    });

    it('renders RatingsByStar without an add-on', () => {
      const root = render({ addon: null });
      const ratingsByStar = root.find(RatingsByStar);

      expect(ratingsByStar).toHaveProp('addon', null);
    });

    it('renders RatingsByStar with an add-on', () => {
      const addon = { ...fakeAddon, id: 8892 };
      dispatchAddon(addon);
      const root = render();
      const ratingsByStar = root.find(RatingsByStar);

      expect(ratingsByStar).toHaveProp('addon');
      // Do a sanity check to make sure the right add-on was used.
      // This can't compare the full object since it the test doesn't have
      // access to the internal add-on.
      expect(ratingsByStar.prop('addon')).toMatchObject({ id: addon.id });
    });

    it('renders loading text without an add-on', () => {
      const root = render({ addon: null });

      expect(
        root.find('.AddonReviewList-addonAverage').find(LoadingText),
      ).toHaveLength(1);
    });

    it('renders empty text without add-on ratings', () => {
      dispatchAddon({ ...fakeAddon, ratings: undefined });
      const root = render();

      expect(root.find('.AddonReviewList-addonAverage').text()).toEqual('');
    });

    it('renders a fixed star average', () => {
      dispatchAddon({
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          average: 4.6667,
        },
      });
      const root = render();

      expect(root.find('.AddonReviewList-addonAverage').text()).toEqual(
        '4.7 star average',
      );
    });

    it('renders whole number star averages', () => {
      dispatchAddon({
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          average: 4.0,
        },
      });
      const root = render();

      expect(root.find('.AddonReviewList-addonAverage').text()).toEqual(
        '4 star average',
      );
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
