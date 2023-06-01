import {
  createInternalReview,
  unloadAddonReviews,
  updateRatingCounts,
} from 'amo/actions/reviews';
import { ADDON_TYPE_EXTENSION } from 'amo/constants';
import addons, {
  createGroupedRatings,
  createInternalAddon,
  createInternalAddonInfo,
  createInternalPreviews,
  fetchAddon,
  fetchAddonInfo,
  getAddonByID,
  getAddonByIdInURL,
  getAddonInfoBySlug,
  getAllAddons,
  initialState,
  isAddonInfoLoading,
  isAddonLoading,
  loadAddon,
  loadAddonInfo,
  selectLocalizedUrlWithOutgoing,
} from 'amo/reducers/addons';
import { setLang } from 'amo/reducers/api';
import {
  createFakeAddon,
  createInternalAddonWithLang,
  createLocalizedString,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakePreview,
  createFakeAddonInfo,
  fakeReview,
} from 'tests/unit/helpers';

describe(__filename, () => {
  // We need a state with setLang called for any tests that use loadAddon or loadAddonInfo.
  const lang = 'en-US';
  const stateWithLang = addons(undefined, setLang(lang));

  it('defaults to its initial state', () => {
    expect(addons(undefined, { type: 'SOME_OTHER_ACTION' })).toEqual(
      initialState,
    );
  });

  it('ignores unrelated actions', () => {
    const firstState = addons(
      stateWithLang,
      loadAddon({ addon: fakeAddon, slug: fakeAddon.slug }),
    );
    expect(addons(firstState, { type: 'UNRELATED_ACTION' })).toEqual(
      firstState,
    );
  });

  it('stores addons from entities', () => {
    const firstState = addons(
      stateWithLang,
      loadAddon({ addon: fakeAddon, slug: fakeAddon.slug }),
    );

    const anotherFakeAddon = {
      ...fakeAddon,
      slug: 'testing1234',
      id: 6401,
    };
    const newState = addons(
      firstState,
      loadAddon({ addon: anotherFakeAddon, slug: anotherFakeAddon.slug }),
    );

    const internalAddon = createInternalAddonWithLang(anotherFakeAddon);
    expect(newState.byID).toEqual({
      ...firstState.byID,
      [anotherFakeAddon.id]: internalAddon,
    });
    expect(newState.bySlug).toEqual({
      ...firstState.bySlug,
      [anotherFakeAddon.slug]: anotherFakeAddon.id,
    });
    expect(newState.byGUID).toEqual({
      ...firstState.byGUID,
      [anotherFakeAddon.guid]: anotherFakeAddon.id,
    });
  });

  it('stores all add-ons, indexed by id', () => {
    const addon1 = { ...fakeAddon, slug: 'first-slug', id: 123 };
    const addon2 = { ...fakeAddon, slug: 'second-slug', id: 456 };

    let state = addons(
      stateWithLang,
      loadAddon({ addon: addon1, slug: addon1.slug }),
    );
    state = addons(state, loadAddon({ addon: addon2, slug: addon2.slug }));

    expect(Object.keys(state.byID).sort()).toEqual(['123', '456']);
  });

  it('stores all add-on slugs with their IDs', () => {
    const addon1 = { ...fakeAddon, slug: 'first-slug', id: 123 };
    const addon2 = { ...fakeAddon, slug: 'second-slug', id: 456 };

    let state = addons(
      stateWithLang,
      loadAddon({ addon: addon1, slug: addon1.slug }),
    );
    state = addons(state, loadAddon({ addon: addon2, slug: addon2.slug }));

    expect(state.bySlug).toEqual({
      'first-slug': 123,
      'second-slug': 456,
    });
  });

  it('stores all add-on slugs in lowercase', () => {
    const addon1 = { ...fakeAddon, slug: 'FIRST', id: 123 };
    const addon2 = { ...fakeAddon, slug: 'SeCond', id: 456 };

    let state = addons(
      stateWithLang,
      loadAddon({ addon: addon1, slug: addon1.slug }),
    );
    state = addons(state, loadAddon({ addon: addon2, slug: addon2.slug }));

    expect(state.bySlug).toEqual({
      first: 123,
      second: 456,
    });
  });

  it('stores an internal representation of an extension', () => {
    const addon = { ...fakeAddon, type: ADDON_TYPE_EXTENSION };

    const state = addons(stateWithLang, loadAddon({ addon, slug: addon.slug }));

    expect(getAddonByID(state, addon.id)).toEqual(
      createInternalAddonWithLang(addon),
    );
  });

  it('exposes `isMozillaSignedExtension` from current version file', () => {
    const addon = createFakeAddon({
      file: { is_mozilla_signed_extension: true },
    });

    const state = addons(stateWithLang, loadAddon({ addon, slug: addon.slug }));
    expect(getAddonByID(state, addon.id).isMozillaSignedExtension).toBe(true);
  });

  it('sets `isMozillaSignedExtension` to `false` when not declared', () => {
    const addon = createFakeAddon({
      file: { is_mozilla_signed_extension: false },
    });

    const state = addons(stateWithLang, loadAddon({ addon, slug: addon.slug }));
    expect(getAddonByID(state, addon.id).isMozillaSignedExtension).toBe(false);
  });

  it('sets the loading state for add-ons to false', () => {
    const addon1 = { ...fakeAddon, slug: 'first-slug' };
    const addon2 = { ...fakeAddon, slug: 'second-slug' };

    let state = addons(
      stateWithLang,
      loadAddon({ addon: addon1, slug: addon1.slug }),
    );
    state = addons(state, loadAddon({ addon: addon2, slug: addon2.slug }));

    expect(state.loadingByIdInURL).toEqual({
      'first-slug': false,
      'second-slug': false,
    });
  });

  describe('fetchAddon', () => {
    const defaultParams = Object.freeze({
      slug: 'addon-slug',
      errorHandler: createStubErrorHandler(),
    });

    it('requires an error handler', () => {
      const params = { ...defaultParams };
      delete params.errorHandler;
      expect(() => fetchAddon(params)).toThrow(/errorHandler cannot be empty/);
    });

    it('requires a slug', () => {
      const params = { ...defaultParams };
      delete params.slug;
      expect(() => fetchAddon(params)).toThrow(/slug cannot be empty/);
    });

    it('stores a loading state for an add-on', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({ slug, errorHandler: createStubErrorHandler() }),
      );
      expect(state.loadingByIdInURL[slug]).toBe(true);
    });
  });

  describe('getAddonByID', () => {
    it('returns null if no add-on found with the given slug', () => {
      const { state } = dispatchClientMetadata();

      expect(getAddonByID(state.addons, 'id')).toEqual(null);
    });

    it('returns an add-on by id', () => {
      const { store } = dispatchClientMetadata();
      store.dispatch(loadAddon({ addon: fakeAddon, slug: fakeAddon.slug }));

      expect(getAddonByID(store.getState().addons, fakeAddon.id)).toEqual(
        createInternalAddonWithLang(fakeAddon),
      );
    });
  });

  describe('getAllAddons', () => {
    it('returns an empty array when no add-ons are loaded', () => {
      const { state } = dispatchClientMetadata();

      expect(getAllAddons(state)).toEqual([]);
    });

    it('returns an array of add-ons', () => {
      const { store } = dispatchClientMetadata();
      store.dispatch(loadAddon({ addon: fakeAddon, slug: fakeAddon.slug }));

      expect(getAllAddons(store.getState())).toEqual([
        createInternalAddonWithLang(fakeAddon),
      ]);
    });
  });

  describe('isAddonLoading', () => {
    it('returns false for an add-on that has never been fetched or loaded', () => {
      const fetchedSlug = 'some-slug';
      const nonfetchedSlug = 'another-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug: fetchedSlug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(isAddonLoading({ addons: state }, nonfetchedSlug)).toBe(false);
    });

    it('returns true for an add-on that is loading', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(isAddonLoading({ addons: state }, slug)).toBe(true);
    });

    it('returns false when slug is not a string', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(isAddonLoading({ addons: state }, 123)).toBe(false);
    });

    it('returns false when slug is null', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(isAddonLoading({ addons: state }, null)).toBe(false);
    });

    it('returns false when slug is undefined', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddon({
          slug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      expect(isAddonLoading({ addons: state }, undefined)).toBe(false);
    });

    it('returns false for an add-on that has finished loading', () => {
      const slug = 'some-slug';
      const addon = { ...fakeAddon, slug };
      let state = addons(
        stateWithLang,
        fetchAddon({
          slug,
          errorHandler: createStubErrorHandler(),
        }),
      );
      state = addons(state, loadAddon({ addon, slug }));

      expect(isAddonLoading({ addons: state }, slug)).toBe(false);
    });
  });

  describe('unloadAddonReviews', () => {
    it('unloads all data for an add-on', () => {
      const guid1 = '1@mozilla.com';
      const id1 = 1;
      // Keep this slug in uppercase to make sure we unload it.
      const slug1 = 'SLUG-1';
      const guid2 = '2@mozilla.com';
      const id2 = 2;
      const slug2 = 'slug-2';
      const addon1 = {
        ...fakeAddon,
        guid: guid1,
        id: id1,
        slug: slug1,
      };
      const addon2 = {
        ...fakeAddon,
        ...fakeAddon,
        guid: guid2,
        id: id2,
        slug: slug2,
      };

      let state = addons(
        stateWithLang,
        loadAddon({ addon: addon1, slug: slug1 }),
      );
      state = addons(state, loadAddon({ addon: addon2, slug: slug2 }));

      state = addons(state, unloadAddonReviews({ addonId: id1, reviewId: 1 }));

      expect(getAddonByID(state, addon1.id)).toEqual(null);
      expect(state.bySlug).toEqual({ [slug2]: id2 });
      expect(state.loadingByIdInURL).toEqual({ [slug2]: false });
    });

    it('does nothing if the add-on was not loaded', () => {
      const id1 = 1;
      const slug1 = 'slug-1';
      const id2 = 2;
      const addon1 = { ...fakeAddon, id: id1, slug: slug1 };

      const state = addons(
        stateWithLang,
        loadAddon({ addon: addon1, slug: slug1 }),
      );

      const newState = addons(
        state,
        unloadAddonReviews({ addonId: id2, reviewId: 1 }),
      );

      expect(state).toEqual(newState);
    });
  });

  describe('updateRatingCounts', () => {
    function _updateRatingCounts({
      addonId = 321,
      oldReview = null,
      newReview = createInternalReview({ ...fakeReview }),
    } = {}) {
      return updateRatingCounts({ addonId, oldReview, newReview });
    }

    function addonWithRatings(ratings = {}) {
      return {
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          ...ratings,
        },
      };
    }

    function initStateWithAddon(addon = { ...fakeAddon }) {
      return addons(stateWithLang, loadAddon({ addon, slug: addon.slug }));
    }

    function reviewWithScore(score) {
      return createInternalReview({ ...fakeReview, score });
    }

    function average(numbers) {
      return numbers.reduce((total, num) => total + num, 0) / numbers.length;
    }

    it('does nothing if the add-on has not been loaded', () => {
      const state = addons(initialState, _updateRatingCounts());

      expect(state).toEqual(initialState);
    });

    it('increment group counts for a new rating', () => {
      const addon = fakeAddon;
      let state = initStateWithAddon(addon);

      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: null,
          newReview: reviewWithScore(5),
        }),
      );
      const storedAddon = getAddonByID(state, addon.id);
      expect(storedAddon.ratings.grouped_counts[5]).toEqual(1);
    });

    it('shifts rating counts', () => {
      const oneStarCount = 5;
      const fiveStarCount = 30;
      const addon = addonWithRatings({
        grouped_counts: createGroupedRatings({
          1: oneStarCount,
          5: fiveStarCount,
        }),
      });

      let state = initStateWithAddon(addon);

      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: reviewWithScore(1),
          newReview: reviewWithScore(5),
        }),
      );
      const storedAddon = getAddonByID(state, addon.id);
      expect(storedAddon.ratings.grouped_counts[1]).toEqual(oneStarCount - 1);
      expect(storedAddon.ratings.grouped_counts[5]).toEqual(fiveStarCount + 1);
    });

    it('handles no score change', () => {
      const fiveStarCount = 30;
      const addon = addonWithRatings({
        grouped_counts: createGroupedRatings({
          5: fiveStarCount,
        }),
      });

      let state = initStateWithAddon(addon);

      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: reviewWithScore(5),
          newReview: reviewWithScore(5),
        }),
      );
      const storedAddon = getAddonByID(state, addon.id);
      expect(storedAddon.ratings.grouped_counts[5]).toEqual(fiveStarCount);
    });

    it('automatically initializes grouped ratings', () => {
      const addon = fakeAddon;

      let state = initStateWithAddon(addon);

      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: null,
          newReview: reviewWithScore(3),
        }),
      );
      const storedAddon = getAddonByID(state, addon.id);
      expect(storedAddon.ratings.grouped_counts).toEqual(
        createGroupedRatings({ 3: 1 }),
      );
    });

    it('does not decrement 0 counts', () => {
      const addon = addonWithRatings({
        grouped_counts: createGroupedRatings({
          5: 0,
        }),
      });

      let state = initStateWithAddon(addon);

      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: reviewWithScore(5),
          newReview: reviewWithScore(4),
        }),
      );
      const storedAddon = getAddonByID(state, addon.id);
      expect(storedAddon.ratings.grouped_counts[5]).toEqual(0);
    });

    it('handles a new review without a score', () => {
      const fiveStarCount = 10;
      const addon = addonWithRatings({
        grouped_counts: createGroupedRatings({
          5: fiveStarCount,
        }),
      });

      let state = initStateWithAddon(addon);

      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: null,
          newReview: reviewWithScore(null),
        }),
      );
      const storedAddon = getAddonByID(state, addon.id);
      expect(storedAddon.ratings.grouped_counts[5]).toEqual(fiveStarCount);
    });

    it('increments only the rating count for a newly added score', () => {
      const ratingCount = 300;
      const reviewCount = 200;
      const addon = addonWithRatings({
        count: ratingCount,
        text_count: reviewCount,
      });

      let state = initStateWithAddon(addon);
      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: null,
          newReview: createInternalReview({
            ...fakeReview,
            body: null,
            score: 5,
          }),
        }),
      );

      const storedAddon = getAddonByID(state, addon.id);
      expect(storedAddon.ratings.count).toEqual(ratingCount + 1);
      // Since a review without a body was added, no change.
      expect(storedAddon.ratings.text_count).toEqual(reviewCount);
    });

    it('increments the review count for newly added bodies', () => {
      const reviewCount = 200;
      const addon = addonWithRatings({
        text_count: reviewCount,
      });

      let state = initStateWithAddon(addon);
      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: null,
          newReview: createInternalReview({
            ...fakeReview,
            body: 'Fantastic add-on',
            score: 5,
          }),
        }),
      );

      expect(getAddonByID(state, addon.id).ratings.text_count).toEqual(
        reviewCount + 1,
      );
    });

    it('increments the review count for reviews updated to include a body', () => {
      const reviewCount = 200;
      const addon = addonWithRatings({
        text_count: reviewCount,
      });

      let state = initStateWithAddon(addon);
      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: createInternalReview({
            ...fakeReview,
            body: null,
            score: 5,
          }),
          newReview: createInternalReview({
            ...fakeReview,
            body: 'Fantastic add-on',
            score: 5,
          }),
        }),
      );

      expect(getAddonByID(state, addon.id).ratings.text_count).toEqual(
        reviewCount + 1,
      );
    });

    it('does not increment rating or review counts for existing reviews', () => {
      const ratingCount = 100;
      const reviewCount = 200;
      const addon = addonWithRatings({
        count: ratingCount,
        text_count: reviewCount,
      });

      let state = initStateWithAddon(addon);
      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: createInternalReview({ ...fakeReview }),
          newReview: createInternalReview({ ...fakeReview }),
        }),
      );

      const newAddon = getAddonByID(state, addon.id);
      expect(newAddon.ratings.count).toEqual(ratingCount);
      expect(newAddon.ratings.text_count).toEqual(reviewCount);
    });

    it('increments counts even when no counts existed before', () => {
      const addon = { ...fakeAddon, ratings: null };

      let state = initStateWithAddon(addon);
      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: null,
          newReview: createInternalReview({
            ...fakeReview,
            body: 'This add-on is nice',
            score: 5,
          }),
        }),
      );

      const storedAddon = getAddonByID(state, addon.id);
      expect(storedAddon.ratings.count).toEqual(1);
      expect(storedAddon.ratings.text_count).toEqual(1);
    });

    it('recalculates average rating when the score changes', () => {
      const ratings = [4, 4, 3, 5];
      const addon = addonWithRatings({
        average: average(ratings),
        count: ratings.length,
      });

      const oldScore = ratings.pop();
      const newScore = 1;
      ratings.push(newScore);

      let state = initStateWithAddon(addon);
      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: createInternalReview({ ...fakeReview, score: oldScore }),
          newReview: createInternalReview({ ...fakeReview, score: newScore }),
        }),
      );

      expect(getAddonByID(state, addon.id).ratings.average.toFixed(3)).toEqual(
        average(ratings).toFixed(3),
      );
    });

    it('recalculates average rating for new scores', () => {
      const ratings = [4, 4, 5];
      const addon = addonWithRatings({
        average: average(ratings),
        count: ratings.length,
      });

      const newScore = 1;
      ratings.push(newScore);

      let state = initStateWithAddon(addon);
      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: null,
          newReview: createInternalReview({ ...fakeReview, score: newScore }),
        }),
      );

      expect(getAddonByID(state, addon.id).ratings.average.toFixed(3)).toEqual(
        average(ratings).toFixed(3),
      );
    });

    it('calculates an average if one did not exist before', () => {
      const addon = { ...fakeAddon, ratings: null };

      const newScore = 1;
      const ratings = [newScore];

      let state = initStateWithAddon(addon);
      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: null,
          newReview: createInternalReview({ ...fakeReview, score: newScore }),
        }),
      );

      expect(getAddonByID(state, addon.id).ratings.average.toFixed(3)).toEqual(
        average(ratings).toFixed(3),
      );
    });

    it('can handle rating counts of 1', () => {
      const oldAverage = 5;
      const count = 1;
      const addon = addonWithRatings({
        average: oldAverage,
        count,
      });

      let state = initStateWithAddon(addon);
      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: createInternalReview({
            ...fakeReview,
            body: null,
            score: 5,
          }),
          newReview: createInternalReview({
            ...fakeReview,
            body: 'Fantastic add-on',
            score: 5,
          }),
        }),
      );

      // Make sure average is not NaN
      expect(getAddonByID(state, addon.id).ratings.average).toEqual(oldAverage);
    });

    it('sets bayesian_average to average', () => {
      const ratings = [5, 5, 5];
      const addon = addonWithRatings({
        average: average(ratings),
        bayesian_average: average(ratings),
        count: ratings.length,
      });

      const newScore = 1;
      ratings.push(newScore);

      let state = initStateWithAddon(addon);
      state = addons(
        state,
        _updateRatingCounts({
          addonId: addon.id,
          oldReview: null,
          newReview: createInternalReview({ ...fakeReview, score: newScore }),
        }),
      );

      expect(
        getAddonByID(state, addon.id).ratings.bayesian_average.toFixed(3),
      ).toEqual(average(ratings).toFixed(3));
    });
  });

  describe('addonInfo', () => {
    it('sets a loading flag when fetching info', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddonInfo({ errorHandlerId: 1, slug }),
      );

      expect(isAddonInfoLoading({ state, slug })).toBe(true);
    });

    it('clears info when fetching info', () => {
      const slug = 'some-slug';
      const state = addons(
        undefined,
        fetchAddonInfo({ errorHandlerId: 1, slug }),
      );

      expect(getAddonInfoBySlug({ slug, state })).toEqual(null);
    });

    it('clears the loading flag when loading info', () => {
      let state;
      const slug = 'some-slug';
      state = addons(
        stateWithLang,
        fetchAddonInfo({ errorHandlerId: 1, slug }),
      );
      state = addons(
        state,
        loadAddonInfo({
          info: createFakeAddonInfo(),
          slug,
        }),
      );

      expect(isAddonInfoLoading({ slug, state })).toBe(false);
    });

    it('loads info', () => {
      const slug = 'some-slug';
      const info = createFakeAddonInfo();
      const state = addons(stateWithLang, loadAddonInfo({ slug, info }));

      expect(getAddonInfoBySlug({ slug, state })).toEqual(
        createInternalAddonInfo(info, lang),
      );
    });

    describe('isAddonInfoLoading', () => {
      it('returns false if info has never been loaded', () => {
        const state = addons(undefined, {
          type: 'SOME_OTHER_ACTION',
        });
        expect(isAddonInfoLoading({ slug: 'some-slug', state })).toBe(false);
      });
    });

    describe('getAddonInfoBySlug', () => {
      it('returns null if no info has been loaded', () => {
        const state = addons(undefined, {
          type: 'SOME_OTHER_ACTION',
        });
        expect(getAddonInfoBySlug({ slug: 'some-slug', state })).toEqual(null);
      });
    });
  });

  describe('getAddonByIdInURL', () => {
    it('returns an add-on for a given known id', () => {
      const addon = fakeAddon;
      const slug = 'some-slug';
      const state = addons(stateWithLang, loadAddon({ addon, slug }));

      expect(getAddonByIdInURL(state, slug)).toEqual(
        createInternalAddonWithLang(addon),
      );
    });

    it('returns null when the id is unknown', () => {
      expect(getAddonByIdInURL(initialState, 'some-slug')).toEqual(null);
    });
  });

  describe('createInternalAddon', () => {
    it('coverts localized strings into localized strings with locale', () => {
      const description = 'Some description';
      const developer_comments = 'developer comments';
      const homepage = {
        url: 'https://myhomepage.com',
        outgoing: 'https://outgoing.mozilla.org/myh',
      };
      const name = 'My addon';
      const previews = [fakePreview];
      const summary = 'A summary';
      const support_email = 'someemail@mozilla.com';
      const support_url = {
        url: 'https://support.com',
        outgoing: 'https://outgoing.mozilla.org/sup',
      };

      const addon = createInternalAddon(
        {
          ...fakeAddon,
          description: createLocalizedString(description, lang),
          developer_comments: createLocalizedString(developer_comments, lang),
          homepage: {
            url: createLocalizedString(homepage.url, lang),
            outgoing: createLocalizedString(homepage.outgoing, lang),
          },
          name: createLocalizedString(name, lang),
          previews,
          summary: createLocalizedString(summary, lang),
          support_email: createLocalizedString(support_email, lang),
          support_url: {
            url: createLocalizedString(support_url.url, lang),
            outgoing: createLocalizedString(support_url.outgoing, lang),
          },
        },
        lang,
      );

      expect(addon.description.content).toEqual(description);
      expect(addon.description.locale).toEqual(lang);
      expect(addon.developer_comments.content).toEqual(developer_comments);
      expect(addon.developer_comments.locale).toEqual(lang);
      expect(addon.homepage).toEqual(homepage);
      expect(addon.name.content).toEqual(name);
      expect(addon.name.locale).toEqual(lang);
      expect(addon.previews).toEqual(createInternalPreviews(previews, lang));
      expect(addon.summary.content).toEqual(summary);
      expect(addon.summary.locale).toEqual(lang);
      expect(addon.support_email.content).toEqual(support_email);
      expect(addon.support_email.locale).toEqual(lang);
      expect(addon.support_url).toEqual(support_url);
    });
  });

  describe('createInternalAddonInfo', () => {
    it('coverts localized strings into simple strings', () => {
      const eula = 'some eula';
      const privacyPolicy = 'some privacy policy';

      const addonInfo = createInternalAddonInfo(
        createFakeAddonInfo({ eula, privacyPolicy }),
        lang,
      );

      expect(addonInfo.eula).toEqual(eula);
      expect(addonInfo.privacyPolicy).toEqual(privacyPolicy);
    });
  });

  describe('createInternalPreviews', () => {
    it('coverts external previews into internal previews', () => {
      const caption1 = 'My caption';
      const caption2 = 'Another caption';
      const preview1 = {
        ...fakePreview,
        caption: createLocalizedString(caption1, lang),
      };
      const preview2 = {
        ...fakePreview,
        caption: createLocalizedString(caption2, lang),
      };

      expect(createInternalPreviews([preview1, preview2], lang)).toEqual([
        {
          h: preview1.image_size[1],
          src: preview1.image_url,
          thumbnail_h: preview1.thumbnail_size[1],
          thumbnail_src: preview1.thumbnail_url,
          thumbnail_w: preview1.thumbnail_size[0],
          title: caption1,
          w: preview1.image_size[0],
        },
        {
          h: preview2.image_size[1],
          src: preview2.image_url,
          thumbnail_h: preview2.thumbnail_size[1],
          thumbnail_src: preview2.thumbnail_url,
          thumbnail_w: preview2.thumbnail_size[0],
          title: caption2,
          w: preview2.image_size[0],
        },
      ]);
    });
  });

  describe('selectLocalizedUrlWithOutgoing', () => {
    it('selects the url and outgoing url in the correct locale', () => {
      const fr_urls = {
        url: 'https://fr.foo.baa/',
        outgoing: 'https://outgoing/?123&fr.foo.baa',
      };
      const en_urls = {
        url: 'https://en.foo.baa/',
        outgoing: 'https://outgoing/?123&en.foo.baa',
      };

      expect(
        selectLocalizedUrlWithOutgoing(
          {
            url: { fr: fr_urls.url, 'en-US': en_urls.url },
            outgoing: { fr: fr_urls.outgoing, 'en-US': en_urls.outgoing },
          },
          'fr',
        ),
      ).toEqual(fr_urls);
    });

    it('returns null if the localizedUrl is null or if url or outgoing is missing', () => {
      expect(selectLocalizedUrlWithOutgoing(null, lang)).toEqual(null);

      expect(
        selectLocalizedUrlWithOutgoing(
          { url: { [lang]: 'https://url' } },
          lang,
        ),
      ).toEqual(null);

      expect(
        selectLocalizedUrlWithOutgoing(
          { outgoing: { [lang]: 'https://url' } },
          lang,
        ),
      ).toEqual(null);
    });
  });
});
