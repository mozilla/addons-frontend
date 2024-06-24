import config from 'config';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  fetchReview,
  fetchReviews,
  fetchReviewPermissions,
  setAddonReviews,
  setReview,
  setReviewPermissions,
} from 'amo/actions/reviews';
import { setViewContext } from 'amo/actions/viewContext';
import { extractId, SHOW_ALL_REVIEWS } from 'amo/pages/AddonReviewList';
import { DEFAULT_API_PAGE_SIZE, createApiError } from 'amo/api';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  SET_VIEW_CONTEXT,
} from 'amo/constants';
import { hrefLangs } from 'amo/languages';
import { fetchAddon, loadAddon } from 'amo/reducers/addons';
import {
  changeLocation,
  createFailedErrorHandler,
  createFakeErrorHandler,
  createLocalizedString,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeAddon,
  fakeReview,
  getElement,
  getElements,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultSlug = 'reviewed-add-on';
  const defaultUserId = 123;
  const lang = 'en-US';
  let store;
  let addon;
  let history;

  const getLocation = ({ page, reviewId, score, slug = defaultSlug } = {}) => {
    let queryString = '?';
    if (page) {
      queryString = `${queryString}&page=${page}`;
    }
    if (score) {
      queryString = `${queryString}&score=${score}`;
    }
    return `/${lang}/${clientApp}/addon/${slug}/reviews/${
      reviewId ? `${reviewId}/` : ''
    }${queryString}`;
  };

  const getErrorHandlerId = ({ page = '', slug = defaultSlug } = {}) =>
    `src/amo/pages/AddonReviewList/index.js-${slug}-${page}`;
  const getFakeErrorHandler = ({ page = '', slug = defaultSlug } = {}) =>
    createFakeErrorHandler({ id: getErrorHandlerId({ page, slug }) });

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
    addon = { ...fakeAddon, slug: defaultSlug };
  });

  const render = ({
    location,
    page,
    reviewId,
    score,
    slug = defaultSlug,
  } = {}) => {
    const initialEntry =
      location || getLocation({ page, reviewId, score, slug });
    const renderOptions = {
      initialEntries: [initialEntry],
      store,
    };
    const renderResults = defaultRender(renderOptions);
    history = renderResults.history;
    return renderResults;
  };

  const _loadAddon = (addonToLoad = addon) => {
    store.dispatch(loadAddon({ addon: addonToLoad, slug: addonToLoad.slug }));
  };

  const _fetchReviews = (params = {}) => {
    return fetchReviews({
      page: '1',
      score: null,
      ...params,
    });
  };

  const _setAddonReviews = ({
    page = '1',
    reviews = [{ ...fakeReview, id: 1 }],
    score = null,
    ...params
  } = {}) => {
    const action = setAddonReviews({
      addonSlug: addon.slug,
      page,
      pageSize: DEFAULT_API_PAGE_SIZE,
      reviewCount: reviews.length,
      reviews,
      score,
      ...params,
    });
    store.dispatch(action);
  };

  const renderWithAddon = ({
    location,
    page,
    reviewId,
    score,
    slug = defaultSlug,
  } = {}) => {
    _loadAddon();

    return render({ location, page, reviewId, score, slug });
  };

  const renderWithAddonAndReviews = ({
    location,
    page,
    reviewId,
    reviews = [
      { ...fakeReview, id: 1, score: 1 },
      { ...fakeReview, id: 2, score: 2 },
    ],
    score,
    slug = defaultSlug,
  } = {}) => {
    _setAddonReviews({ page, reviews, score });

    return renderWithAddon({ location, page, reviewId, score, slug });
  };

  const signInAndSetReviewPermissions = ({
    addonId = addon.id,
    userId = defaultUserId,
    ...permissions
  } = {}) => {
    dispatchSignInActionsWithStore({ store, userId });
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
      render();

      const cards = screen.getAllByClassName('AddonReviewCard');
      // Make sure four review placeholders were rendered.
      expect(cards).toHaveLength(4);
      cards.forEach((card) =>
        expect(within(card).getAllByRole('alert')).toHaveLength(2),
      );
    });

    it('displays 4 placeholders while loading for an addon with no reviews', () => {
      addon.ratings = { ...addon.ratings, count: 0 };
      renderWithAddon();

      const cards = screen.getAllByClassName('AddonReviewCard');
      expect(cards).toHaveLength(4);
      cards.forEach((card) =>
        expect(within(card).getAllByRole('alert')).toHaveLength(2),
      );
    });

    it('displays the same number of placeholders as there are reviews for an addon', () => {
      const reviewCount = 6;
      addon.ratings = { ...addon.ratings, count: reviewCount };
      renderWithAddon();

      const cards = screen.getAllByClassName('AddonReviewCard');
      expect(cards).toHaveLength(reviewCount);
      cards.forEach((card) =>
        expect(within(card).getAllByRole('alert')).toHaveLength(2),
      );
    });

    it('displays 25 placeholders for more than 25 reviews for an addon', () => {
      addon.ratings = {
        ...fakeAddon.ratings,
        count: DEFAULT_API_PAGE_SIZE + 1,
      };
      renderWithAddon();

      expect(screen.getAllByClassName('AddonReviewCard')).toHaveLength(
        DEFAULT_API_PAGE_SIZE,
      );
    });

    it('renders an AddonSummaryCard with an addon', () => {
      const name = 'My addon';
      addon.name = createLocalizedString(name);
      renderWithAddon();

      expect(screen.getByAltText('Add-on icon')).toHaveAttribute(
        'src',
        addon.icon_url,
      );
      expect(
        screen.getByRole('heading', { name: `Reviews for ${name}` }),
      ).toBeInTheDocument();
    });

    it('renders an AddonSummaryCard without an addon', () => {
      render();

      expect(screen.getAllByTitle('There are no ratings yet')).toHaveLength(6);
    });

    it('does not paginate before reviews have loaded', () => {
      renderWithAddon();

      expect(screen.queryByClassName('Paginate')).not.toBeInTheDocument();
    });

    it('fetches an addon if requested by slug', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).toHaveBeenCalledWith(
        fetchAddon({
          slug: defaultSlug,
          showGroupedRatings: true,
          errorHandler: getFakeErrorHandler(),
        }),
      );
    });

    it('does not fetch an addon if it is already loading', () => {
      const errorHandler = getFakeErrorHandler();
      store.dispatch(fetchAddon({ errorHandler, slug: defaultSlug }));
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).not.toHaveBeenCalledWith(
        fetchAddon({
          slug: defaultSlug,
          showGroupedRatings: true,
          errorHandler,
        }),
      );
    });

    it('ignores other add-ons', () => {
      _loadAddon();
      render({ slug: `${defaultSlug}-other` });

      const cards = screen.getAllByClassName('AddonReviewCard');
      expect(cards).toHaveLength(4);
      expect(within(cards[0]).getAllByRole('alert')).toHaveLength(2);
    });

    it('fetches reviews if needed', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      expect(dispatch).toHaveBeenCalledWith(
        _fetchReviews({
          addonSlug: defaultSlug,
          errorHandlerId: getErrorHandlerId(),
        }),
      );
    });

    it('does not fetch reviews if they are already loading', () => {
      store.dispatch(
        _fetchReviews({
          addonSlug: defaultSlug,
          errorHandlerId: getErrorHandlerId(),
        }),
      );
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      expect(dispatch).not.toHaveBeenCalledWith(
        _fetchReviews({
          addonSlug: defaultSlug,
          errorHandlerId: getErrorHandlerId(),
        }),
      );
    });

    it('fetches reviews if needed during an update', async () => {
      const newSlug = `${defaultSlug}-other`;
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      _loadAddon({
        ...addon,
        guid: `${addon.id + 1}@my-addons.firefox`,
        id: addon.id + 1,
        slug: newSlug,
      });

      await changeLocation({
        history,
        pathname: getLocation({ slug: newSlug }),
      });

      expect(dispatch).toHaveBeenCalledWith(
        _fetchReviews({
          addonSlug: newSlug,
          errorHandlerId: getErrorHandlerId({ slug: newSlug }),
        }),
      );
    });

    it('fetches reviews by page', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const page = '2';
      renderWithAddon({ page });

      expect(dispatch).toHaveBeenCalledWith(
        _fetchReviews({
          addonSlug: defaultSlug,
          errorHandlerId: getErrorHandlerId({ page }),
          page,
        }),
      );
    });

    it('fetches reviews when the page changes', async () => {
      const page = '2';
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddonAndReviews();

      await changeLocation({
        history,
        pathname: getLocation({ page }),
      });

      expect(dispatch).toHaveBeenCalledWith(
        _fetchReviews({
          addonSlug: defaultSlug,
          errorHandlerId: getErrorHandlerId({ page }),
          page,
        }),
      );
    });

    it('fetches reviews by score', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const score = '5';
      renderWithAddon({ score });

      expect(dispatch).toHaveBeenCalledWith(
        _fetchReviews({
          addonSlug: defaultSlug,
          errorHandlerId: getErrorHandlerId(),
          score,
        }),
      );
    });

    it('dispatches fetchReviews with an invalid page variable', () => {
      // We intentionally pass invalid pages to the API to get a 404 response.
      const dispatch = jest.spyOn(store, 'dispatch');
      const page = 'x';
      renderWithAddon({ page });

      expect(dispatch).toHaveBeenCalledWith(
        _fetchReviews({
          addonSlug: defaultSlug,
          errorHandlerId: getErrorHandlerId({ page }),
          page,
        }),
      );
    });

    it('fetches reviews when the score changes', async () => {
      const score = '4';
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddonAndReviews();

      await changeLocation({
        history,
        pathname: getLocation({ score }),
      });

      expect(dispatch).toHaveBeenCalledWith(
        _fetchReviews({
          addonSlug: defaultSlug,
          errorHandlerId: getErrorHandlerId(),
          score,
        }),
      );
    });

    it('does not fetch an addon if there is an error', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      createFailedErrorHandler({
        id: getErrorHandlerId(),
        store,
      });
      render();

      expect(dispatch).not.toHaveBeenCalledWith(
        fetchAddon({
          slug: defaultSlug,
          showGroupedRatings: true,
          errorHandler: getFakeErrorHandler(),
        }),
      );
    });

    it('does not fetch reviews if there is an error', () => {
      createFailedErrorHandler({
        id: getErrorHandlerId(),
        store,
      });
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      expect(dispatch).not.toHaveBeenCalledWith(
        _fetchReviews({
          addonSlug: defaultSlug,
          errorHandlerId: getErrorHandlerId(),
        }),
      );
    });

    it('dispatches a view context for the add-on', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      expect(dispatch).toHaveBeenCalledWith(setViewContext(addon.type));
    });

    it('does not dispatch a view context if there is no add-on', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: SET_VIEW_CONTEXT }),
      );
    });

    it('does not dispatch a view context for similar add-ons', async () => {
      const newSlug = `${defaultSlug}-other`;
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      _loadAddon({
        ...addon,
        guid: `${addon.id + 1}@my-addons.firefox`,
        id: addon.id + 1,
        slug: newSlug,
      });

      dispatch.mockClear();

      await changeLocation({
        history,
        pathname: getLocation({ slug: newSlug }),
      });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: SET_VIEW_CONTEXT }),
      );
    });

    it('dispatches a view context for new add-on types', async () => {
      const newSlug = `${defaultSlug}-other`;
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      _loadAddon({
        ...addon,
        guid: `${addon.id + 1}@my-addons.firefox`,
        id: addon.id + 1,
        slug: newSlug,
        type: ADDON_TYPE_STATIC_THEME,
      });

      dispatch.mockClear();

      await changeLocation({
        history,
        pathname: getLocation({ slug: newSlug }),
      });

      expect(dispatch).toHaveBeenCalledWith(
        setViewContext(ADDON_TYPE_STATIC_THEME),
      );
    });

    it('renders an error', () => {
      const message = 'Some error message';
      createFailedErrorHandler({
        id: getErrorHandlerId(),
        message,
        store,
      });
      renderWithAddon();

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('passes the errorHandler to the Page component', () => {
      createFailedErrorHandler({
        error: createApiError({
          response: { status: 404 },
        }),
        id: getErrorHandlerId(),
        store,
      });
      renderWithAddon();

      expect(
        screen.getByText('Oops! We can’t find that page'),
      ).toBeInTheDocument();
    });

    it('renders a list of reviews with ratings', () => {
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      renderWithAddonAndReviews({ reviews });

      // First review.
      expect(screen.getAllByTitle('Rated 1 out of 5')).toHaveLength(6);
      // Second review.
      expect(screen.getAllByTitle('Rated 2 out of 5')).toHaveLength(6);
    });

    it('renders content when no reviews exist', () => {
      renderWithAddonAndReviews({ reviews: [] });

      expect(screen.getByText('There are no reviews')).toBeInTheDocument();
      expect(screen.getByText('Show all reviews')).toBeInTheDocument();

      // We do not want to display "0 review" in the header.
      expect(
        screen.getByClassName('AddonReviewList-reviewCount'),
      ).toHaveTextContent('');
    });

    it('does not include a review in the listing if the review is also featured', () => {
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      renderWithAddonAndReviews({ reviewId: reviews[0].id, reviews });

      // Featured review.
      expect(
        within(screen.getByClassName('FeaturedAddonReview')).getAllByTitle(
          'Rated 1 out of 5',
        ),
      ).toHaveLength(6);
      // Review listing.
      expect(
        within(
          screen.getByClassName('AddonReviewList-reviews-listing'),
        ).getAllByTitle('Rated 2 out of 5'),
      ).toHaveLength(6);
      expect(
        within(
          // eslint-disable-next-line testing-library/prefer-presence-queries
          screen.getByClassName('AddonReviewList-reviews-listing'),
        ).queryByTitle('Rated 1 out of 5'),
      ).not.toBeInTheDocument();
    });

    it('does not display a listing if the only review is also featured', () => {
      const reviewId = 1;
      const reviews = [{ ...fakeReview, id: reviewId }];
      renderWithAddonAndReviews({ reviewId: reviews[0].id, reviews });

      expect(
        screen.queryByClassName('AddonReviewList-reviews-listing'),
      ).not.toBeInTheDocument();
    });

    it('renders a class name with its type', () => {
      addon.type = ADDON_TYPE_STATIC_THEME;
      renderWithAddon();

      expect(screen.getByClassName('AddonReviewList')).toHaveClass(
        `AddonReviewList--${ADDON_TYPE_STATIC_THEME}`,
      );
    });

    it('configures CardList with a count of review results', () => {
      addon.ratings = {
        ...fakeAddon.ratings,
        // This is the total of all ratings and reviews.
        count: 200,
      };
      // These are the actual review results returned by the API.
      const reviewCount = 5;
      renderWithAddonAndReviews({
        reviews: Array(reviewCount).fill(fakeReview),
      });

      expect(screen.getByText(`${reviewCount} reviews`)).toBeInTheDocument();
    });

    it('configures CardList header with LoadingText', () => {
      addon.ratings = { ...addon.ratings, count: 0 };
      renderWithAddon();

      // Expect 2 per placeholder review (of which there should be 4), plus
      // 1 in the header.
      expect(
        within(screen.getByClassName('AddonReviewList-reviews')).getAllByRole(
          'alert',
        ),
      ).toHaveLength(9);
    });

    describe('with pagination', () => {
      const renderWithPagination = ({
        page = '1',
        reviews = Array(DEFAULT_API_PAGE_SIZE + 2).fill(fakeReview),
        ...otherProps
      } = {}) => {
        return renderWithAddonAndReviews({ page, reviews, ...otherProps });
      };

      it('configures a paginator with the right URL', () => {
        renderWithPagination();

        expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
          'href',
          `/en-US/firefox/addon/${defaultSlug}/reviews/?page=2`,
        );
      });

      it('adds UTM query parameters to the reviews URL when there are some', () => {
        const utmCampaign = 'some-utm-campaign';
        renderWithPagination({
          location: `${getLocation()}&utm_campaign=${utmCampaign}`,
        });

        expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
          'href',
          `/en-US/firefox/addon/${defaultSlug}/reviews/?utm_campaign=${utmCampaign}&page=2`,
        );
      });

      it('configures a paginator with the right review count', () => {
        const reviews = Array(DEFAULT_API_PAGE_SIZE + 2).fill(fakeReview);
        renderWithPagination({ reviews });

        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      });

      it('sets the paginator to the query string page', () => {
        const reviews = Array(DEFAULT_API_PAGE_SIZE + 2).fill(fakeReview);
        renderWithPagination({ page: '2', reviews });

        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
      });
    });

    it('renders an HTML title', async () => {
      const name = 'My addon';
      addon.name = createLocalizedString(name);
      renderWithAddon();

      await waitFor(() =>
        expect(getElement('title')).toHaveTextContent(`Reviews for ${name}`),
      );
    });

    it('does not render an HTML title when there is no add-on', async () => {
      render();

      await waitFor(() =>
        expect(getElement('title')).toHaveTextContent(
          'Add-ons for Firefox (en-US)',
        ),
      );
    });

    it('does not render a robots meta tag', async () => {
      renderWithAddonAndReviews();

      await waitFor(() => expect(getElement('title')).toBeInTheDocument());

      expect(getElements('meta[name="robots"]')).toHaveLength(0);
    });

    it('renders a canonical link for the list page with alternates', async () => {
      renderWithAddonAndReviews();

      const getExpectedURL = (locale, app) => {
        return `${config.get('baseURL')}/${locale}/${app}/addon/${defaultSlug}/reviews/`
      }

      await waitFor(() =>
        expect(getElement('link[rel="canonical"]')).toHaveAttribute(
          'href',
         getExpectedURL('en-US', 'firefox')
        ),
      );

      await waitFor(() =>
        expect(getElement('link[rel="alternate"]')).toBeInTheDocument(),
      );

      expect(getElements('link[rel="alternate"]')).toHaveLength(
        hrefLangs.length,
      );

      const hrefLangsMap = config.get('hrefLangsMap');
      hrefLangs.forEach(hrefLang => {
        const locale = hrefLangsMap[hrefLang] || hrefLang;
        expect(
          getElement(`link[rel="alternate"][hreflang="${hrefLang}"]`),
        ).toHaveAttribute('href', getExpectedURL(locale, 'firefox'));
      });
    });

    it('renders a robots meta tag when there is a featured review', async () => {
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      renderWithAddonAndReviews({
        reviewId: reviews[0].id,
        reviews,
      });

      await waitFor(() =>
        expect(getElement('meta[name="robots"]')).toHaveAttribute(
          'content',
          'noindex, follow',
        ),
      );
    });

    it('dispatches fetchReviewPermissions on mount', () => {
      const userId = 66432;
      dispatchSignInActionsWithStore({ store, userId });
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      expect(dispatch).toHaveBeenCalledWith(
        fetchReviewPermissions({
          addonId: addon.id,
          errorHandlerId: getErrorHandlerId(),
          userId,
        }),
      );
    });

    it('dispatches fetchReviewPermissions on update', async () => {
      const userId = 66432;
      dispatchSignInActionsWithStore({ store, userId });
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      dispatch.mockClear();

      dispatchSignInActionsWithStore({ store, userId: userId + 1 });

      await waitFor(() => {
        expect(dispatch).toHaveBeenCalledWith(
          fetchReviewPermissions({
            addonId: addon.id,
            errorHandlerId: getErrorHandlerId(),
            userId: userId + 1,
          }),
        );
      });
    });

    it('does not dispatch fetchReviewPermissions() when an error has occurred', () => {
      const userId = 66432;
      dispatchSignInActionsWithStore({ store, userId });
      createFailedErrorHandler({
        id: getErrorHandlerId(),
        store,
      });
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      expect(dispatch).not.toHaveBeenCalledWith(
        fetchReviewPermissions({
          addonId: addon.id,
          errorHandlerId: getErrorHandlerId(),
          userId,
        }),
      );
    });

    it('does not dispatch fetchReviewPermissions() if they are already loading', () => {
      const userId = 66432;
      dispatchSignInActionsWithStore({ store, userId });
      createFailedErrorHandler({
        id: getErrorHandlerId(),
        store,
      });
      const fetchAction = fetchReviewPermissions({
        addonId: addon.id,
        errorHandlerId: getErrorHandlerId(),
        userId,
      });
      store.dispatch(fetchAction);
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      expect(dispatch).not.toHaveBeenCalledWith(
        fetchReviewPermissions({
          addonId: addon.id,
          errorHandlerId: getErrorHandlerId(),
          userId,
        }),
      );
    });

    it('does not dispatch fetchReviewPermissions() if they are already loaded', () => {
      const userId = 66432;
      signInAndSetReviewPermissions({
        userId,
        canReplyToReviews: true,
      });

      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon();

      expect(dispatch).not.toHaveBeenCalledWith(
        fetchReviewPermissions({
          addonId: addon.id,
          errorHandlerId: getErrorHandlerId(),
          userId,
        }),
      );
    });

    it('sets siteUserCanReply when siteUser has permissions', () => {
      const reviews = [
        { ...fakeReview, id: 1, score: 1 },
        { ...fakeReview, id: 2, score: 2 },
      ];
      const userId = 99654;
      signInAndSetReviewPermissions({
        userId,
        canReplyToReviews: true,
      });
      renderWithAddonAndReviews({ reviews });

      expect(
        screen.getAllByRole('link', { name: 'Reply to this review' }),
      ).toHaveLength(2);
    });

    it('passes siteUserCanReply to FeaturedAddonReview', () => {
      const reviewId = 8765;
      signInAndSetReviewPermissions({
        canReplyToReviews: true,
      });
      renderWithAddonAndReviews({
        reviewId,
        reviews: [{ ...fakeReview, id: reviewId }],
      });

      expect(
        within(screen.getByClassName('FeaturedAddonReview')).getByRole('link', {
          name: 'Reply to this review',
        }),
      ).toBeInTheDocument();
    });
  });

  it('renders a "description" meta tag', async () => {
    const name = 'My addon';
    addon.name = createLocalizedString(name);
    renderWithAddon();

    await waitFor(() =>
      expect(getElement('meta[name="description"]')).toHaveAttribute(
        'content',
        `Reviews and ratings for ${name}. Find out what other users think ` +
          `about ${name} and add it to your Firefox Browser.`,
      ),
    );
  });

  describe('filterByScoreSelector', () => {
    const getSelector = () =>
      within(screen.getByClassName('AddonReviewList-filterByScore')).getByRole(
        'combobox',
      );

    it('disables the selector before the add-on loads', () => {
      render();

      expect(getSelector()).toHaveProperty('disabled', true);
    });

    it('enables the selector once the add-on loads', () => {
      renderWithAddon();

      expect(getSelector()).toHaveProperty('disabled', false);
    });

    it('lets you select all reviews', async () => {
      renderWithAddonAndReviews();

      const pushSpy = jest.spyOn(history, 'push');
      await userEvent.selectOptions(getSelector(), SHOW_ALL_REVIEWS);

      expect(pushSpy).toHaveBeenCalledWith(
        `/en-US/firefox/addon/${defaultSlug}/reviews/`,
      );
    });

    it.each([
      [5, 'Show only five-star reviews'],
      [4, 'Show only four-star reviews'],
      [3, 'Show only three-star reviews'],
      [2, 'Show only two-star reviews'],
      [1, 'Show only one-star reviews'],
    ])('lets you select only %s star reviews', async (score, option) => {
      renderWithAddonAndReviews();

      const pushSpy = jest.spyOn(history, 'push');
      await userEvent.selectOptions(getSelector(), option);

      expect(pushSpy).toHaveBeenCalledWith(
        `/en-US/firefox/addon/${defaultSlug}/reviews/?score=${score}`,
      );
    });

    it('sets the selector to the current score', () => {
      const score = '3';
      renderWithAddonAndReviews({ score });

      expect(getSelector()).toHaveValue(score);
    });

    it('defaults the selector to showing all reviews', () => {
      renderWithAddonAndReviews();

      expect(getSelector()).toHaveValue(SHOW_ALL_REVIEWS);
    });
  });

  describe('extractId', () => {
    it('returns a unique ID based on the addon slug and page', () => {
      expect(
        extractId({
          match: { params: { addonSlug: 'foobar' } },
          location: { query: { page: 22 } },
        }),
      ).toEqual('foobar-22');
    });

    it('returns a unique ID even when there is no page', () => {
      expect(
        extractId({
          match: { params: { addonSlug: 'foobar' } },
          location: { query: {} },
        }),
      ).toEqual('foobar-');
    });
  });

  describe('Tests for FeaturedAddonReview', () => {
    const getThisErrorHandlerId = (reviewId) =>
      `src/amo/components/FeaturedAddonReview/index.js-${reviewId}`;

    it('fetches a review at construction', () => {
      const reviewId = '1';
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon({ reviewId });

      expect(dispatch).toHaveBeenCalledWith(
        fetchReview({
          reviewId,
          errorHandlerId: getThisErrorHandlerId(reviewId),
        }),
      );
    });

    it('fetches a review when the reviewId changes', async () => {
      const firstReviewId = '1';
      const secondReviewId = '2';
      store.dispatch(
        fetchReview({
          errorHandlerId: getThisErrorHandlerId(firstReviewId),
          reviewId: firstReviewId,
        }),
      );
      store.dispatch(setReview({ ...fakeReview, id: firstReviewId }));
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon({ reviewId: firstReviewId });

      await changeLocation({
        history,
        pathname: getLocation({ reviewId: secondReviewId }),
      });

      expect(dispatch).toHaveBeenCalledWith(
        fetchReview({
          reviewId: secondReviewId,
          errorHandlerId: getThisErrorHandlerId(secondReviewId),
        }),
      );
    });

    it('does not fetch a review if one is already loaded', () => {
      const reviewId = '1';
      store.dispatch(setReview({ ...fakeReview, id: reviewId }));
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithAddon({ reviewId });

      expect(dispatch).not.toHaveBeenCalledWith(
        fetchReview({
          reviewId,
          errorHandlerId: getThisErrorHandlerId(reviewId),
        }),
      );
    });

    it('displays a message if the review is not found', () => {
      const reviewId = '1';
      createFailedErrorHandler({
        error: createApiError({
          response: { status: 404 },
        }),
        id: getThisErrorHandlerId(reviewId),
        store,
      });
      renderWithAddon({ reviewId });

      expect(screen.getByText('The review was not found.')).toBeInTheDocument();
    });

    it('displays the correct header for a review', () => {
      const reviewId = 123;
      store.dispatch(setReview({ ...fakeReview, id: reviewId }));
      renderWithAddon({ reviewId });

      expect(
        screen.getByText(`Review by ${fakeReview.user.name}`),
      ).toBeInTheDocument();
    });

    it('displays the correct header for a reply', () => {
      const reviewId = 123;
      store.dispatch(
        setReview({ ...fakeReview, id: reviewId, is_developer_reply: true }),
      );
      renderWithAddon({ reviewId });

      expect(
        screen.getByText(`Response by ${fakeReview.user.name}`),
      ).toBeInTheDocument();
    });
  });
});
