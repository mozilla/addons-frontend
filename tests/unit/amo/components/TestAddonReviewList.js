import { shallow } from 'enzyme';
import React from 'react';

import fallbackIcon from 'amo/img/icons/default-64.png';
import createStore from 'amo/store';
import { fetchReviews, setAddonReviews } from 'amo/actions/reviews';
import { setViewContext } from 'amo/actions/viewContext';
import {
  AddonReviewListBase,
  mapStateToProps,
} from 'amo/components/AddonReviewList';
import Link from 'amo/components/Link';
import Paginate from 'core/components/Paginate';
import { loadEntities } from 'core/actions';
import { fetchAddon, flattenApiAddon } from 'core/reducers/addons';
import ErrorList from 'ui/components/ErrorList';
import Rating from 'ui/components/Rating';
import { fakeAddon, fakeReview } from 'tests/unit/amo/helpers';
import {
  createFetchAddonResult,
  createStubErrorHandler,
  getFakeI18nInst,
} from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';

function getLoadedReviews({
  addonSlug = fakeAddon.slug, reviews = [fakeReview], reviewCount = 1 } = {},
) {
  const action = setAddonReviews({ addonSlug, reviewCount, reviews });
  // This is how reviews look after they have been loaded.
  return action.payload.reviews;
}

describe('amo/components/AddonReviewList', () => {
  describe('<AddonReviewListBase/>', () => {
    function render({
      addon = fakeAddon,
      dispatch = sinon.stub(),
      errorHandler = createStubErrorHandler(),
      params = {
        addonSlug: fakeAddon.slug,
      },
      reviews = [fakeReview],
      ...customProps
    } = {}) {
      const loadedReviews = reviews ? getLoadedReviews({ reviews }) : null;
      const props = {
        addon,
        dispatch,
        errorHandler,
        i18n: getFakeI18nInst(),
        location: { query: {} },
        params,
        reviewCount: loadedReviews && loadedReviews.length,
        reviews: loadedReviews,
        ...customProps,
      };

      return shallow(<AddonReviewListBase {...props} />);
    }

    it('requires an addonSlug property', () => {
      expect(() => render({ params: { addonSlug: null } }))
        .toThrowError(/addonSlug cannot be falsey/);
    });

    it('waits for an addon and reviews to load', () => {
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

    it('does not paginate before reviews have loaded', () => {
      const root = render({ addon: fakeAddon, reviews: null });

      expect(root.find(Paginate)).toHaveLength(0);
    });

    it('fetches an addon if needed', () => {
      const addonSlug = 'some-addon-slug';
      const dispatch = sinon.stub();
      const errorHandler = createStubErrorHandler();

      render({
        addon: null, errorHandler, params: { addonSlug }, dispatch,
      });

      sinon.assert.calledWith(dispatch, fetchAddon({
        slug: addonSlug, errorHandler,
      }));
    });

    it('fetches reviews if needed', () => {
      const addon = { ...fakeAddon, slug: 'some-other-slug' };
      const dispatch = sinon.stub();
      const errorHandler = createStubErrorHandler();

      render({
        addon,
        reviews: null,
        errorHandler,
        params: { addonSlug: addon.slug },
        dispatch,
      });

      sinon.assert.calledWith(dispatch, fetchReviews({
        addonSlug: addon.slug,
        errorHandlerId: errorHandler.id,
      }));
    });

    it('fetches reviews if needed during an update', () => {
      const addon = { ...fakeAddon, slug: 'some-other-slug' };
      const dispatch = sinon.stub();
      const errorHandler = createStubErrorHandler();

      const root = render({
        addon: null,
        reviews: null,
        errorHandler,
        params: { addonSlug: addon.slug },
        dispatch,
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
      const dispatch = sinon.stub();
      const errorHandler = createStubErrorHandler();
      const addonSlug = fakeAddon.slug;
      const page = 2;

      render({
        reviews: null,
        errorHandler,
        location: { query: { page } },
        params: { addonSlug },
        dispatch,
      });

      sinon.assert.calledWith(dispatch, fetchReviews({
        addonSlug,
        errorHandlerId: errorHandler.id,
        page,
      }));
    });

    it('fetches reviews when the page changes', () => {
      const dispatch = sinon.stub();
      const errorHandler = createStubErrorHandler();
      const addonSlug = fakeAddon.slug;

      const root = render({
        errorHandler,
        location: { query: { page: 2 } },
        params: { addonSlug },
        dispatch,
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
      const dispatch = sinon.stub();
      const errorHandler = createStubErrorHandler(new Error('some error'));

      render({
        addon: null,
        errorHandler,
        params: { addonSlug: addon.slug },
        dispatch,
      });

      sinon.assert.notCalled(dispatch);
    });

    it('does not fetch reviews if there is an error', () => {
      const dispatch = sinon.stub();
      const errorHandler = createStubErrorHandler(new Error('some error'));

      render({
        reviews: null,
        errorHandler,
        dispatch,
      });

      sinon.assert.notCalled(dispatch);
    });

    it('dispatches a view context for the add-on', () => {
      const dispatch = sinon.stub();
      render({ addon: fakeAddon, dispatch });

      sinon.assert.calledWith(
        dispatch, setViewContext(fakeAddon.type));
    });

    it('renders an error', () => {
      const errorHandler = createStubErrorHandler(new Error('some error'));

      const root = render({ errorHandler });
      expect(root.find(ErrorList)).toHaveLength(1);
    });

    it('renders a list of reviews with ratings', () => {
      const reviews = [
        { ...fakeReview, rating: 1 },
        { ...fakeReview, rating: 2 },
      ];
      const tree = render({ reviews });
      const ratings = tree.find(Rating);
      expect(ratings).toHaveLength(2);

      expect(ratings.at(0)).toHaveProp('rating', 1);
      expect(ratings.at(0)).toHaveProp('readOnly', true);
      expect(ratings.at(1)).toHaveProp('rating', 2);
      expect(ratings.at(1)).toHaveProp('readOnly', true);
    });

    it('renders a review', () => {
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

    it("renders the add-on's icon in the header", () => {
      const root = render({ addon: fakeAddon });
      const img = root.find('.AddonReviewList-header-icon img');
      expect(img).toHaveProp('src', fakeAddon.icon_url);
    });

    it('renders the fallback icon if the origin is not allowed', () => {
      const root = render({
        addon: {
          ...fakeAddon,
          icon_url: 'http://foo.com/hax.png',
        },
      });
      const img = root.find('.AddonReviewList-header-icon img');
      expect(img).toHaveProp('src', fallbackIcon);
    });

    it('renders a hidden h1 for SEO', () => {
      const root = render({ addon: fakeAddon });
      const h1 = root.find('.AddonReviewList-header h1');
      expect(h1).toHaveClassName('visually-hidden');
      expect(h1).toHaveText(`Reviews for ${fakeAddon.name}`);
    });

    it('produces an addon URL', () => {
      expect(render().instance().addonURL())
        .toEqual(`/addon/${fakeAddon.slug}/`);
    });

    it('produces a URL to itself', () => {
      expect(render().instance().url())
        .toEqual(`/addon/${fakeAddon.slug}/reviews/`);
    });

    it('requires an addon prop to produce a URL', () => {
      expect(() => render({ addon: null }).instance().addonURL())
        .toThrowError(/cannot access addonURL/);
    });

    it('configures a paginator with the right URL', () => {
      const root = render();
      expect(root.find(Paginate))
        .toHaveProp('pathname', root.instance().url());
    });

    it('configures a paginator with the right Link', () => {
      expect(render().find(Paginate)).toHaveProp('LinkComponent', Link);
    });

    it('configures a paginator with the right review count', () => {
      const root = render({ reviewCount: 500 });
      expect(root.find(Paginate)).toHaveProp('count', 500);
    });

    it('sets the paginator to page 1 without a query', () => {
      // Render with an empty query string.
      const root = render({ location: { query: {} } });
      expect(root.find(Paginate)).toHaveProp('currentPage', 1);
    });

    it('sets the paginator to the query string page', () => {
      const root = render({ location: { query: { page: 3 } } });
      expect(root.find(Paginate)).toHaveProp('currentPage', 3);
    });
  });

  describe('mapStateToProps', () => {
    let store;

    beforeEach(() => {
      store = createStore().store;
    });

    function getMappedProps({
      addonSlug = fakeAddon.slug, params = { addonSlug },
    } = {}) {
      return mapStateToProps(store.getState(), { params });
    }

    it('loads addon from state', () => {
      store.dispatch(loadEntities(createFetchAddonResult(fakeAddon).entities));
      const props = getMappedProps();
      expect(props.addon).toEqual(flattenApiAddon(fakeAddon));
    });

    it('ignores other add-ons', () => {
      store.dispatch(loadEntities(createFetchAddonResult(fakeAddon).entities));
      const props = getMappedProps({ addonSlug: 'other-slug' });
      expect(props.addon).toBe(undefined);
    });

    it('requires component properties', () => {
      expect(() => getMappedProps({ params: null }))
        .toThrowError(/component had a falsey params.addonSlug parameter/);
    });

    it('requires an existing slug property', () => {
      expect(() => getMappedProps({ params: {} }))
        .toThrowError(/component had a falsey params.addonSlug parameter/);
    });

    it('loads all reviews from state', () => {
      const reviews = [{ ...fakeReview, id: 1 }, { ...fakeReview, id: 2 }];
      const action = setAddonReviews({
        addonSlug: fakeAddon.slug, reviews, reviewCount: reviews.length,
      });
      store.dispatch(action);

      const props = getMappedProps();
      expect(props.reviews).toEqual(action.payload.reviews);
    });

    it('only loads existing reviews', () => {
      const props = getMappedProps();
      expect(props.reviews).toBe(undefined);
      expect(props.reviewCount).toBe(undefined);
    });

    it('sets reviewCount prop from from state', () => {
      store.dispatch(setAddonReviews({
        addonSlug: fakeAddon.slug, reviews: [fakeReview], reviewCount: 1,
      }));

      const props = getMappedProps();
      expect(props.reviewCount).toEqual(1);
    });
  });
});
