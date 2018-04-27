import * as React from 'react';

import AddonsByAuthorsCard, {
  AddonsByAuthorsCardBase,
} from 'amo/components/AddonsByAuthorsCard';
import {
  fetchAddonsByAuthors,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { createInternalAddon } from 'core/reducers/addons';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_DICT,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
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
    ...fakeAuthor, name: 'Krupa', username: 'krupa', id: 51,
  };
  const fakeAuthorTwo = {
    ...fakeAuthor, name: 'Matt', username: 'tofumatt', id: 61,
  };
  const fakeAuthorThree = {
    ...fakeAuthor, name: 'Fligtar', username: 'fligtar', id: 71,
  };

  function fakeAddons() {
    const firstAddon = {
      ...fakeAddon,
      id: 6,
      slug: 'first',
      authors: [fakeAuthorOne, fakeAuthorTwo],
    };
    const secondAddon = {
      ...fakeAddon, id: 7, slug: 'second', authors: [fakeAuthorTwo],
    };
    const thirdAddon = {
      ...fakeAddon, id: 8, slug: 'third', authors: [fakeAuthorThree],
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
    return loadAddonsByAuthors({
      addons: [
        {
          ...fakeAddon,
          id: 5,
          slug: 'foo',
          type: addonType,
          authors: [fakeAuthorOne],
        },
        {
          ...fakeAddon,
          id: 6,
          slug: 'bar',
          type: addonType,
          authors: multipleAuthors ?
            [fakeAuthorTwo] :
            [fakeAuthorOne],
        },
      ],
      addonType,
      authorUsernames: multipleAuthors ?
        [fakeAuthorOne.username, fakeAuthorTwo.username] : [fakeAuthorOne.username],
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
      AddonsByAuthorsCardBase
    );
  }

  function renderAddonsWithType({ addonType, header, multipleAuthors = false } = {}) {
    const authorUsernames = multipleAuthors ?
      [fakeAuthorOne.username, fakeAuthorTwo.username] : [fakeAuthorOne.username];
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({ addonType, multipleAuthors }));

    return render({
      addonType,
      header,
      authorUsernames,
      errorHandler,
      store,
    });
  }

  it('should render a card', () => {
    const { store } = dispatchClientMetadata();
    const authorUsernames = fakeAuthorUsernames();
    const addons = Object.values(fakeAddons()).sort();
    store.dispatch(loadAddonsByAuthors({ addons, authorUsernames }));

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
    expect(sortAddons(root.find(AddonsCard).prop('addons')))
      .toEqual(sortAddons(addons).map(createInternalAddon));
    expect(root.find(AddonsCard))
      .toHaveProp('placeholderCount', root.instance().props.numberOfAddons);
    expect(root.find(AddonsCard)).toHaveProp('showSummary', false);
    expect(root.find(AddonsCard)).toHaveProp('type', 'horizontal');
  });

  it('should render a className', () => {
    const { store } = dispatchClientMetadata();
    const authorUsernames = fakeAuthorUsernames();
    store.dispatch(loadAddonsByAuthors({
      addons: Object.values(fakeAddons()),
      authorUsernames,
    }));

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
    store.dispatch(loadAddonsByAuthors({
      addons: [],
      authorUsernames,
    }));

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
    store.dispatch(fetchAddonsByAuthors({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandlerId: errorHandler.id,
    }));

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      store,
    });

    expect(root).toHaveProp('loading', true);
    expect(root).toHaveClassName('AddonsByAuthorsCard');
  });

  it('should dispatch a fetch action if no add-ons found', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      store,
    });

    sinon.assert.calledWith(dispatchSpy, fetchAddonsByAuthors({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandlerId: errorHandler.id,
    }));
  });

  it('should dispatch a fetch action if authorUsernames are updated', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      store,
    });

    dispatchSpy.reset();

    root.setProps({
      addonType: ADDON_TYPE_THEME,
      authorUsernames: ['test1'],
    });

    sinon.assert.calledWith(dispatchSpy, fetchAddonsByAuthors({
      addonType: ADDON_TYPE_THEME,
      authorUsernames: ['test1'],
      errorHandlerId: errorHandler.id,
    }));

    // Make sure an authorUsernames update even with the same addonType dispatches
    // a fetch action.
    dispatchSpy.reset();

    root.setProps({
      addonType: ADDON_TYPE_THEME,
      authorUsernames: ['test2'],
    });

    sinon.assert.calledWith(dispatchSpy, fetchAddonsByAuthors({
      addonType: ADDON_TYPE_THEME,
      authorUsernames: ['test2'],
      errorHandlerId: errorHandler.id,
    }));
  });

  it('should dispatch a fetch action if addonType is updated', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      store,
    });

    dispatchSpy.reset();

    root.setProps({
      addonType: ADDON_TYPE_OPENSEARCH,
      authorUsernames: ['test2'],
    });

    sinon.assert.calledWith(dispatchSpy, fetchAddonsByAuthors({
      addonType: ADDON_TYPE_OPENSEARCH,
      authorUsernames: ['test2'],
      errorHandlerId: errorHandler.id,
    }));
  });

  it('should dispatch a fetch action if forAddonSlug is updated', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      store,
    });

    dispatchSpy.reset();

    root.setProps({
      forAddonSlug: 'testing',
    });

    sinon.assert.calledWith(dispatchSpy, fetchAddonsByAuthors({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandlerId: errorHandler.id,
      forAddonSlug: 'testing',
    }));
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

    dispatchSpy.reset();

    root.setProps({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
    });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_DICT,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', `More dictionaries by ${fakeAuthor.name}`);
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_DICT,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', 'More dictionaries by these translators');
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', `More extensions by ${fakeAuthor.name}`);
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', 'More extensions by these developers');
  });

  it('shows extensions in header for ADDON_TYPE_LANG', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_LANG,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', `More language packs by ${fakeAuthor.name}`);
  });

  it('shows extensions in header for ADDON_TYPE_LANG with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_LANG,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', 'More language packs by these translators');
  });

  it('shows extensions in header for ADDON_TYPE_THEME', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', `More themes by ${fakeAuthor.name}`);
  });

  it('shows extensions in header for ADDON_TYPE_THEME with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', 'More themes by these artists');
  });

  it('shows add-ons in header if no specific addonType translation found', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_OPENSEARCH,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', `More add-ons by ${fakeAuthor.name}`);
  });

  it('shows add-ons in header if no specific addonType found with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_OPENSEARCH,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', 'More add-ons by these developers');
  });

  it('shows custom text in header if provided in place of addonType text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      header: 'this will be my header text',
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', 'this will be my header text');
  });
});
