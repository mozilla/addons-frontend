import { shallow } from 'enzyme';
import React from 'react';

import fallbackIcon from 'amo/img/icons/default-64.png';
import createStore from 'amo/store';
import { fetchReviews, setAddonReviews } from 'amo/actions/reviews';
import { setViewContext } from 'amo/actions/viewContext';
import AddonReviewList, {
  AddonReviewListBase,
  mapStateToProps,
} from 'amo/components/AddonReviewList';
import AddonReviewListItem from 'amo/components/AddonReviewListItem';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import Paginate from 'core/components/Paginate';
import {
  fetchAddon, createInternalAddon, loadAddons,
} from 'core/reducers/addons';
import ErrorList from 'ui/components/ErrorList';
import Rating from 'ui/components/Rating';
import { fakeAddon, fakeReview, dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFetchAddonResult,
  createStubErrorHandler,
  getFakeI18nInst,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { setError } from 'core/actions/errors';
import { createApiError } from 'core/api/index';
import LoadingText from 'ui/components/LoadingText';

function getLoadedReviews({
  addonSlug = fakeAddon.slug, reviews = [fakeReview], reviewCount = 1 } = {},
) {
  const action = setAddonReviews({ addonSlug, reviewCount, reviews });
  // This is how reviews look after they have been loaded.
  return action.payload.reviews;
}

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = createStore().store;
  });

  const render = ({
    params = {
      addonSlug: fakeAddon.slug,
    },
    ...customProps
  } = {}) => {
    const props = {
      i18n: getFakeI18nInst(),
      location: { query: {} },
      params,
      store,
      ...customProps,
    };
    return shallowUntilTarget(
      <AddonReviewList {...props} />, AddonReviewListBase
    );
  };

  const dispatchAddon = (addon = fakeAddon) => {
    store.dispatch(loadAddons(createFetchAddonResult(addon).entities));
  };

  const dispatchAddonReviews = ({
    addon = fakeAddon, reviews = [{ ...fakeReview, id: 1 }],
  } = {}) => {
    const action = setAddonReviews({
      addonSlug: addon.slug, reviews, reviewCount: reviews.length,
    });
    store.dispatch(action);
  };

  describe('<AddonReviewList/>', () => {
    it('requires location params', () => {
      expect(() => render({ params: null }))
        .toThrowError(/component had a falsey params\.addonSlug/);
    });

    it('requires an addonSlug param', () => {
      expect(() => render({ params: {} }))
        .toThrowError(/component had a falsey params\.addonSlug/);
    });

    it('requires a non-empty addonSlug param', () => {
      expect(() => render({ params: { addonSlug: null } }))
        .toThrowError(/component had a falsey params\.addonSlug/);
    });

    it('waits for an addon and reviews to load', () => {
      const root = render({ addon: null });
      expect(root.find('.AddonReviewList-header-icon img').prop('src'))
        .toEqual(fallbackIcon);
      expect(root.find('.AddonReviewList-header-text').find(LoadingText))
        .toHaveLength(2);

      // Make sure four review placeholders were rendered.
      expect(root.find(AddonReviewListItem)).toHaveLength(4);
      // Do a sanity check on the first placeholder;
      expect(root.find(AddonReviewListItem).at(0))
        .toHaveProp('review', null);
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
        addon: null, errorHandler, params: { addonSlug },
      });

      sinon.assert.calledWith(dispatch, fetchAddon({
        slug: addonSlug, errorHandler,
      }));
    });

    it('ignores other add-ons', () => {
      dispatchAddon();
      const root = render({
        params: { addonSlug: 'other-slug' },
      });
      expect(root.instance().props.addon).toBe(undefined);
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

      sinon.assert.calledWith(dispatch, fetchReviews({
        addonSlug: addon.slug,
        errorHandlerId: errorHandler.id,
      }));
    });

    it('fetches reviews if needed during an update', () => {
      const addon = createInternalAddon({
        ...fakeAddon, slug: 'some-other-slug',
      });
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      const root = render({
        addon: null,
        reviews: null,
        errorHandler,
        params: { addonSlug: addon.slug },
      });

      dispatch.reset();
      // Simulate how a redux state change will introduce an addon.
      root.setProps({ addon });

      sinon.assert.calledWith(dispatch, fetchReviews({
        addonSlug: addon.slug,
        errorHandlerId: errorHandler.id,
      }));
    });

    it('fetches reviews by page', () => {
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      const addonSlug = fakeAddon.slug;
      const page = 2;

      render({
        reviews: null,
        errorHandler,
        location: { query: { page } },
        params: { addonSlug },
      });

      sinon.assert.calledWith(dispatch, fetchReviews({
        addonSlug,
        errorHandlerId: errorHandler.id,
        page,
      }));
    });

    it('fetches reviews when the page changes', () => {
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      const addonSlug = fakeAddon.slug;

      const root = render({
        errorHandler,
        location: { query: { page: 2 } },
        params: { addonSlug },
      });
      dispatch.reset();
      root.setProps({ location: { query: { page: 3 } } });

      sinon.assert.calledWith(dispatch, fetchReviews({
        addonSlug,
        errorHandlerId: errorHandler.id,
        page: 3,
      }));
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

    it('renders an error', () => {
      const errorHandler = createStubErrorHandler(new Error('some error'));

      const root = render({ errorHandler });
      expect(root.find(ErrorList)).toHaveLength(1);
    });

    it('renders NotFound page if API returns 401 error', () => {
      const id = 'error-handler-id';
      const { store } = dispatchClientMetadata();

      const error = createApiError({
        response: { status: 401 },
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

    it('renders NotFound page if API returns 404 error', () => {
      const id = 'error-handler-id';
      const { store } = dispatchClientMetadata();

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
      const reviews = [
        { ...fakeReview, rating: 1 },
        { ...fakeReview, rating: 2 },
      ];
      dispatchAddon();
      dispatchAddonReviews({ reviews });
      const tree = render();
      const items = tree.find(AddonReviewListItem);
      expect(items).toHaveLength(2);

      expect(items.at(0)).toHaveProp('review');
      expect(items.at(0).prop('review')).toMatchObject({
        rating: reviews[0].rating,
      });
      expect(items.at(1)).toHaveProp('review');
      expect(items.at(1).prop('review')).toMatchObject({
        rating: reviews[1].rating,
      });
    });

    /*

    // TODO: move to AddonReviewListItem tests.

    it('renders a list of reviews with ratings', () => {
      const reviews = [
        { ...fakeReview, rating: 1 },
        { ...fakeReview, rating: 2 },
      ];
      dispatchAddon();
      dispatchAddonReviews({ reviews });
      const tree = render();
      const ratings = tree.find(Rating);
      expect(ratings).toHaveLength(2);

      expect(ratings.at(1)).toHaveProp('rating', 2);
      expect(ratings.at(1)).toHaveProp('readOnly', true);
    });

    it.skip('renders a review', () => {
      const root = render({ reviews: [fakeReview] });
      const fakeReviewWithNewLine = {
        ...fakeReview,
        body: "It's awesome \n isn't it?",
      };
      const wrapper = render({ reviews: [fakeReviewWithNewLine] });

      expect(root.find('.AddonReviewList-li h3'))
        .toHaveText(fakeReview.title);

      expect(root.find('.AddonReviewList-li p'))
        .toHaveHTML(`<p>${fakeReview.body}</p>`);

      expect(root.find('.AddonReviewList-by-line'))
        .toIncludeText(fakeReview.user.name);

      expect(wrapper.find('.AddonReviewList-li p').render().find('br'))
        .toHaveLength(1);
    });

    it.skip('waits for an addon and reviews to load', () => {
      const root = render({ addon: null, reviews: null });
      expect(root.find('.AddonReviewList-header-icon img').prop('src'))
        .toContain('default');
      expect(root.find('.AddonReviewList-header-text').find(LoadingText))
        .toHaveLength(2);

      // Make sure four review placeholders were rendered.
      expect(root.find('.AddonReviewList-li')).toHaveLength(4);
      // Do a sanity check on the first placeholder;
      expect(root.find('.AddonReviewList-li h3').at(0).find(LoadingText))
        .toHaveLength(1);
      expect(root.find('.AddonReviewList-li p').at(0).find(LoadingText))
        .toHaveLength(1);
      expect(root.find('.AddonReviewList-by-line').at(0).find(LoadingText))
        .toHaveLength(1);
    });

    */

    it("renders the add-on's icon in the header", () => {
      const addon = fakeAddon;
      dispatchAddon(addon);
      const root = render();
      const img = root.find('.AddonReviewList-header-icon img');
      expect(img).toHaveProp('src', addon.icon_url);
    });

    it('renders the fallback icon if the origin is not allowed', () => {
      dispatchAddon({
        ...fakeAddon, icon_url: 'http://foo.com/hax.png',
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
      expect(render().instance().addonURL())
        .toEqual(`/addon/${addon.slug}/`);
    });

    it('produces a URL to itself', () => {
      const addon = fakeAddon;
      dispatchAddon(addon);
      expect(render().instance().url())
        .toEqual(`/addon/${addon.slug}/reviews/`);
    });

    it('requires an addon prop to produce a URL', () => {
      expect(() => render({ addon: null }).instance().addonURL())
        .toThrowError(/cannot access addonURL/);
    });

    it('configures a paginator with the right URL', () => {
      dispatchAddon();
      dispatchAddonReviews();
      const root = render();
      expect(root.find(Paginate))
        .toHaveProp('pathname', root.instance().url());
    });

    it('configures a paginator with the right Link', () => {
      dispatchAddon();
      dispatchAddonReviews();
      const root = render();
      expect(root.find(Paginate)).toHaveProp('LinkComponent', Link);
    });

    it('configures a paginator with the right review count', () => {
      const reviews = [
        { ...fakeReview, id: 1 },
        { ...fakeReview, id: 2 },
        { ...fakeReview, id: 3 },
      ];
      dispatchAddon();
      dispatchAddonReviews({ reviews });
      const root = render();
      expect(root.find(Paginate)).toHaveProp('count', reviews.length);
    });

    it('sets the paginator to page 1 without a query', () => {
      dispatchAddon();
      dispatchAddonReviews();
      // Render with an empty query string.
      const root = render({ location: { query: {} } });
      expect(root.find(Paginate)).toHaveProp('currentPage', 1);
    });

    it('sets the paginator to the query string page', () => {
      dispatchAddon();
      dispatchAddonReviews();
      const root = render({ location: { query: { page: 3 } } });
      expect(root.find(Paginate)).toHaveProp('currentPage', 3);
    });
  });
});
