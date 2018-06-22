import * as React from 'react';

import AddonsByAuthorsCard, {
  AddonsByAuthorsCardBase,
} from 'amo/components/AddonsByAuthorsCard';
import {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  THEMES_BY_AUTHORS_PAGE_SIZE,
  fetchAddonsByAuthors,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { createInternalAddon } from 'core/reducers/addons';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_DICT,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
} from 'core/constants';
import AddonsCard from 'amo/components/AddonsCard';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeAuthor,
} from 'tests/unit/amo/helpers';
import {
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const fakeAuthorOne = {
    ...fakeAuthor,
    name: 'Krupa',
    username: 'krupa',
    id: 51,
  };
  const fakeAuthorTwo = {
    ...fakeAuthor,
    name: 'Matt',
    username: 'tofumatt',
    id: 61,
  };
  const fakeAuthorThree = {
    ...fakeAuthor,
    name: 'Fligtar',
    username: 'fligtar',
    id: 71,
  };

  function fakeAddons() {
    const firstAddon = {
      ...fakeAddon,
      id: 6,
      slug: 'first',
      authors: [fakeAuthorOne, fakeAuthorTwo],
    };
    const secondAddon = {
      ...fakeAddon,
      id: 7,
      slug: 'second',
      authors: [fakeAuthorTwo],
    };
    const thirdAddon = {
      ...fakeAddon,
      id: 8,
      slug: 'third',
      authors: [fakeAuthorThree],
    };

    return { firstAddon, secondAddon, thirdAddon };
  }

  function fakeAuthorUsernames() {
    return [
      fakeAuthorOne.username,
      fakeAuthorTwo.username,
      fakeAuthorThree.username,
    ];
  }

  function addonsWithAuthorsOfType({ addonType, multipleAuthors = false }) {
    const pageSize =
      addonType === ADDON_TYPE_THEME
        ? THEMES_BY_AUTHORS_PAGE_SIZE
        : EXTENSIONS_BY_AUTHORS_PAGE_SIZE;

    const addons = [];

    for (let i = 0; i < pageSize; i++) {
      addons.push({
        ...fakeAddon,
        id: i + 1,
        slug: `foo${i}`,
        type: addonType,
        authors: [fakeAuthorOne],
      });
    }

    return loadAddonsByAuthors({
      addons,
      addonType,
      authorUsernames: multipleAuthors
        ? [fakeAuthorOne.username, fakeAuthorTwo.username]
        : [fakeAuthorOne.username],
      count: addons.length,
      pageSize,
    });
  }

  function render(customProps = {}) {
    const props = {
      authorDisplayName: fakeAuthorOne.name,
      numberOfAddons: 4,
      i18n: fakeI18n(),
      store: dispatchClientMetadata().store,
      ...customProps,
    };

    return shallowUntilTarget(
      <AddonsByAuthorsCard {...props} />,
      AddonsByAuthorsCardBase,
    );
  }

  function renderAddonsWithType({
    addonType,
    showMore,
    multipleAuthors = false,
    numberOfAddons = 6,
  } = {}) {
    const authorUsernames = multipleAuthors
      ? [fakeAuthorOne.username, fakeAuthorTwo.username]
      : [fakeAuthorOne.username];
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({ addonType, multipleAuthors }));

    return render({
      addonType,
      showMore,
      authorUsernames,
      errorHandler,
      numberOfAddons,
      store,
    });
  }

  it('should render a card', () => {
    const { store } = dispatchClientMetadata();
    const authorUsernames = fakeAuthorUsernames();
    const addons = Object.values(fakeAddons()).sort();

    store.dispatch(
      loadAddonsByAuthors({
        addons,
        authorUsernames,
        count: addons.length,
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      }),
    );

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames,
      numberOfAddons: 4,
      store,
    });

    // The sort of the add-ons in the reducer isn't set, so we just make sure
    // to sort the add-ons here because the order isn't guaranteed.
    function sortAddons(addonsArray) {
      return addonsArray.sort((a, b) => {
        return a.id > b.id;
      });
    }

    expect(root).toHaveClassName('AddonsByAuthorsCard');
    expect(sortAddons(root.find(AddonsCard).prop('addons'))).toEqual(
      sortAddons(addons).map(createInternalAddon),
    );
    expect(root.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      root.instance().props.numberOfAddons,
    );
    expect(root.find(AddonsCard)).toHaveProp('showSummary', false);
    expect(root.find(AddonsCard)).toHaveProp('type', 'horizontal');
  });

  it('should render a className', () => {
    const { store } = dispatchClientMetadata();
    const authorUsernames = fakeAuthorUsernames();
    const addons = Object.values(fakeAddons());

    store.dispatch(
      loadAddonsByAuthors({
        addons,
        authorUsernames,
        count: addons.length,
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      }),
    );

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames,
      className: 'foo',
      store,
    });

    expect(root).toHaveClassName('foo');
  });

  it('should render nothing if there are no add-ons', () => {
    const { store } = dispatchClientMetadata();
    const authorUsernames = fakeAuthorUsernames();
    store.dispatch(
      loadAddonsByAuthors({
        addons: [],
        authorUsernames,
        count: 0,
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      }),
    );

    const root = render({ authorUsernames, store });

    expect(root).not.toHaveClassName('AddonsByAuthorsCard');
    expect(root.html()).toBeNull();
  });

  it('should render nothing if add-ons are null', () => {
    const root = render({
      addons: null,
      authorUsernames: ['test2'],
    });

    expect(root).not.toHaveClassName('AddonsByAuthorsCard');
    expect(root.html()).toBeNull();
  });

  it('should render a card with loading state if loading', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        authorUsernames: ['test2'],
        errorHandlerId: errorHandler.id,
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      }),
    );

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      store,
    });

    expect(root).toHaveProp('loading', true);
    expect(root).toHaveClassName('AddonsByAuthorsCard');
  });

  // We want to always make sure to do a fetch to make sure
  // we have the latest addons list.
  // See: https://github.com/mozilla/addons-frontend/issues/4852
  it('should always fetch addons by authors', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const numberOfAddons = 4;

    render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      numberOfAddons,
      store,
    });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        authorUsernames: ['test2'],
        errorHandlerId: errorHandler.id,
        pageSize: numberOfAddons,
      }),
    );
  });

  it('should dispatch a fetch action if authorUsernames are updated', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const numberOfAddons = 4;

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      numberOfAddons,
      store,
    });

    dispatchSpy.resetHistory();

    root.setProps({
      addonType: ADDON_TYPE_THEME,
      authorUsernames: ['test1'],
    });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_THEME,
        authorUsernames: ['test1'],
        errorHandlerId: errorHandler.id,
        pageSize: numberOfAddons,
      }),
    );

    // Make sure an authorUsernames update even with the same addonType dispatches
    // a fetch action.
    dispatchSpy.resetHistory();

    root.setProps({
      addonType: ADDON_TYPE_THEME,
      authorUsernames: ['test2'],
    });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_THEME,
        authorUsernames: ['test2'],
        errorHandlerId: errorHandler.id,
        pageSize: numberOfAddons,
      }),
    );
  });

  it('should dispatch a fetch action if addonType is updated', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const numberOfAddons = 6;

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      numberOfAddons,
      store,
    });

    dispatchSpy.resetHistory();

    root.setProps({
      addonType: ADDON_TYPE_OPENSEARCH,
      authorUsernames: ['test2'],
    });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_OPENSEARCH,
        authorUsernames: ['test2'],
        errorHandlerId: errorHandler.id,
        pageSize: numberOfAddons,
      }),
    );
  });

  it('should dispatch a fetch action if forAddonSlug is updated', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const numberOfAddons = 4;

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      numberOfAddons,
      store,
    });

    dispatchSpy.resetHistory();

    root.setProps({
      forAddonSlug: 'testing',
    });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        authorUsernames: ['test2'],
        errorHandlerId: errorHandler.id,
        forAddonSlug: 'testing',
        pageSize: numberOfAddons,
      }),
    );
  });

  it('should not dispatch a fetch action if props are not changed', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      store,
    });

    dispatchSpy.resetHistory();

    root.setProps({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
    });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('should display at most numberOfAddons extensions', () => {
    const numberOfAddons = 4;
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      multipleAuthors: false,
      numberOfAddons,
    });

    expect(root.find(AddonsCard).props().addons).toHaveLength(numberOfAddons);
  });

  it('should display at most numberOfAddons themes', () => {
    const numberOfAddons = 3;
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      multipleAuthors: false,
      numberOfAddons,
    });

    expect(root.find(AddonsCard).props().addons).toHaveLength(numberOfAddons);
  });

  it('should add a theme class if it is a lightweight theme', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
    });

    expect(root).toHaveClassName('AddonsByAuthorsCard--theme');
  });

  it('should add a theme class if it is a static theme', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_STATIC_THEME,
    });

    expect(root).toHaveClassName('AddonsByAuthorsCard--theme');
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_DICT,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More dictionaries by ${fakeAuthor.name}`,
    );
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_DICT,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Dictionaries by ${fakeAuthor.name}`,
    );
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_DICT,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More dictionaries by these translators',
    );
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT with multiple authors and without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_DICT,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Dictionaries by these translators`,
    );
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More extensions by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Extensions by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More extensions by these developers',
    );
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION with multiple authors and without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'Extensions by these developers',
    );
  });

  it('shows extensions in header for ADDON_TYPE_LANG', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_LANG,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More language packs by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for ADDON_TYPE_LANG without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_LANG,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Language packs by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for ADDON_TYPE_LANG with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_LANG,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More language packs by these translators',
    );
  });

  it('shows extensions in header for ADDON_TYPE_LANG with multiple authors and without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_LANG,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'Language packs by these translators',
    );
  });

  it('shows extensions in header for a lightweight theme', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More themes by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for a static theme', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_STATIC_THEME,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More themes by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for a lightweight theme without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Themes by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for a static theme without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_STATIC_THEME,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Themes by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for a lightweight theme with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More themes by these artists',
    );
  });

  it('shows extensions in header for a static theme with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_STATIC_THEME,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More themes by these artists',
    );
  });

  it('shows extensions in header for a lightweight theme with multiple authors and without More text ', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'Themes by these artists',
    );
  });

  it('shows extensions in header for a static theme with multiple authors and without More text ', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_STATIC_THEME,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'Themes by these artists',
    );
  });

  it('shows add-ons in header if no specific addonType translation found', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_OPENSEARCH,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More add-ons by ${fakeAuthor.name}`,
    );
  });

  it('shows add-ons in header if no specific addonType translation found without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_OPENSEARCH,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Add-ons by ${fakeAuthor.name}`,
    );
  });

  it('shows add-ons in header if no specific addonType found with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_OPENSEARCH,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More add-ons by these developers',
    );
  });

  it('shows add-ons in header if no specific addonType found with multiple authors and without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_OPENSEARCH,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'Add-ons by these developers',
    );
  });
});
