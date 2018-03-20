import * as React from 'react';

import MoreAddonsByAuthorsCard, {
  MoreAddonsByAuthorsCardBase,
} from 'amo/components/MoreAddonsByAuthorsCard';
import {
  fetchAddonsByAuthors,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
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
  function fakeAddons() {
    const firstAddon = {
      ...fakeAddon,
      id: 6,
      authors: [
        { ...fakeAuthor, username: 'test', id: 51 },
        { ...fakeAuthor, username: 'test2', id: 61 },
      ],
    };
    const secondAddon = {
      ...fakeAddon,
      id: 7,
      authors: [{ ...fakeAuthor, username: 'test2', id: 61 }],
    };
    const thirdAddon = {
      ...fakeAddon,
      id: 8,
      authors: [{ ...fakeAuthor, username: 'test3', id: 71 }],
    };

    return { firstAddon, secondAddon, thirdAddon };
  }

  function addonsWithAuthorsOfType({ addonType, multipleAuthors = false }) {
    return loadAddonsByAuthors({
      addons: [
        {
          ...fakeAddon,
          id: 5,
          slug: 'foo',
          type: addonType,
          authors: [fakeAuthor],
        },
        {
          ...fakeAddon,
          id: 6,
          slug: 'bar',
          type: addonType,
          authors: multipleAuthors ?
            [{ ...fakeAuthor, id: 50000, username: 'secondAuthor' }] :
            [fakeAuthor],
        },
      ],
      addonType,
      authors: multipleAuthors ?
        [fakeAuthor.username, 'secondAuthor'] : [fakeAuthor.username],
    });
  }

  function render(customProps = {}) {
    const props = {
      i18n: fakeI18n(),
      store: dispatchClientMetadata().store,
      ...customProps,
    };

    return shallowUntilTarget(
      <MoreAddonsByAuthorsCard {...props} />,
      MoreAddonsByAuthorsCardBase
    );
  }

  it('should render a card', () => {
    const { store } = dispatchClientMetadata();
    const authorNames = ['test', 'test2', 'test3'];
    store.dispatch(loadAddonsByAuthors({
      addons: Object.values(fakeAddons()),
      authors: authorNames,
    }));

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorNames,
      store,
    });

    expect(root).toHaveClassName('MoreAddonsByAuthorsCard');
  });

  it('should render a className', () => {
    const { store } = dispatchClientMetadata();
    const authorNames = ['test', 'test2', 'test3'];
    store.dispatch(loadAddonsByAuthors({
      addons: Object.values(fakeAddons()),
      authors: authorNames,
    }));

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorNames,
      className: 'foo',
      store,
    });

    expect(root).toHaveClassName('foo');
  });

  it('should render nothing if there are no add-ons', () => {
    const { store } = dispatchClientMetadata();
    const authorNames = ['test', 'test2', 'test3'];
    store.dispatch(loadAddonsByAuthors({
      addons: [],
      authors: authorNames,
    }));

    const root = render({ authorNames, store });

    expect(root).not.toHaveClassName('MoreAddonsByAuthorsCard');
    expect(root.html()).toBeNull();
  });

  it('should render nothing if add-ons are null', () => {
    const root = render({
      addons: null,
      authorNames: ['test2'],
    });

    expect(root).not.toHaveClassName('MoreAddonsByAuthorsCard');
    expect(root.html()).toBeNull();
  });

  it('should render a card with loading state if loading', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(fetchAddonsByAuthors({
      addonType: ADDON_TYPE_EXTENSION,
      authors: ['test2'],
      errorHandlerId: errorHandler.id,
    }));

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorNames: ['test2'],
      errorHandler,
      store,
    });

    expect(root).toHaveProp('loading', true);
    expect(root).toHaveClassName('MoreAddonsByAuthorsCard');
  });

  it('should dispatch a fetch action if no add-ons found', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    render({
      addonType: ADDON_TYPE_EXTENSION,
      authorNames: ['test2'],
      errorHandler,
      store,
    });

    sinon.assert.calledWith(dispatchSpy, fetchAddonsByAuthors({
      addonType: ADDON_TYPE_EXTENSION,
      authors: ['test2'],
      errorHandlerId: errorHandler.id,
    }));
  });

  it('should dispatch a fetch action if props are updated', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorNames: ['test2'],
      errorHandler,
      store,
    });

    dispatchSpy.reset();

    root.setProps({
      addonType: ADDON_TYPE_THEME,
      authorNames: ['test1'],
    });

    sinon.assert.calledWith(dispatchSpy, fetchAddonsByAuthors({
      addonType: ADDON_TYPE_THEME,
      authors: ['test1'],
      errorHandlerId: errorHandler.id,
    }));

    // Make sure an authorNames update even with the same addonType dispatches
    // a fetch action.
    dispatchSpy.reset();

    root.setProps({
      addonType: ADDON_TYPE_THEME,
      authorNames: ['test2'],
    });

    sinon.assert.calledWith(dispatchSpy, fetchAddonsByAuthors({
      addonType: ADDON_TYPE_THEME,
      authors: ['test2'],
      errorHandlerId: errorHandler.id,
    }));
  });

  it('should dispatch a fetch action if forAddonSlug is updated', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorNames: ['test2'],
      errorHandler,
      store,
    });

    dispatchSpy.reset();

    root.setProps({
      forAddonSlug: 'testing',
    });

    sinon.assert.calledWith(dispatchSpy, fetchAddonsByAuthors({
      addonType: ADDON_TYPE_EXTENSION,
      authors: ['test2'],
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
      authorNames: ['test2'],
      errorHandler,
      store,
    });

    dispatchSpy.reset();

    root.setProps({
      addonType: ADDON_TYPE_EXTENSION,
      authorNames: ['test2'],
    });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({ addonType: ADDON_TYPE_DICT }));

    const root = render({
      addonType: ADDON_TYPE_DICT,
      authorNames: [fakeAuthor.username],
      errorHandler,
      store,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', `More dictionaries by ${fakeAuthor.username}`);
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT with multiple authors', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({
      addonType: ADDON_TYPE_DICT,
      multipleAuthors: true,
    }));

    const root = render({
      addonType: ADDON_TYPE_DICT,
      authorNames: [fakeAuthor.username, 'secondAuthor'],
      errorHandler,
      store,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', 'More dictionaries by these translators');
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({ addonType: ADDON_TYPE_EXTENSION }));

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorNames: [fakeAuthor.username],
      errorHandler,
      store,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', `More extensions by ${fakeAuthor.username}`);
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION with multiple authors', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({
      addonType: ADDON_TYPE_EXTENSION,
      multipleAuthors: true,
    }));

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorNames: [fakeAuthor.username, 'secondAuthor'],
      errorHandler,
      store,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', 'More extensions by these developers');
  });

  it('shows extensions in header for ADDON_TYPE_LANG', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({ addonType: ADDON_TYPE_LANG }));

    const root = render({
      addonType: ADDON_TYPE_LANG,
      authorNames: [fakeAuthor.username],
      errorHandler,
      store,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', `More language packs by ${fakeAuthor.username}`);
  });

  it('shows extensions in header for ADDON_TYPE_LANG with multiple authors', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({
      addonType: ADDON_TYPE_LANG,
      multipleAuthors: true,
    }));

    const root = render({
      addonType: ADDON_TYPE_LANG,
      authorNames: [fakeAuthor.username, 'secondAuthor'],
      errorHandler,
      store,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', 'More language packs by these translators');
  });

  it('shows extensions in header for ADDON_TYPE_THEME', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({ addonType: ADDON_TYPE_THEME }));

    const root = render({
      addonType: ADDON_TYPE_THEME,
      authorNames: [fakeAuthor.username],
      errorHandler,
      store,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', `More themes by ${fakeAuthor.username}`);
  });

  it('shows extensions in header for ADDON_TYPE_THEME with multiple authors', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({
      addonType: ADDON_TYPE_THEME,
      multipleAuthors: true,
    }));

    const root = render({
      addonType: ADDON_TYPE_THEME,
      authorNames: [fakeAuthor.username, 'secondAuthor'],
      errorHandler,
      store,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', 'More themes by these artists');
  });

  it('shows add-ons in header if no specific addonType translation found', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({
      addonType: ADDON_TYPE_OPENSEARCH,
    }));

    const root = render({
      addonType: ADDON_TYPE_OPENSEARCH,
      authorNames: [fakeAuthor.username],
      errorHandler,
      store,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', `More add-ons by ${fakeAuthor.username}`);
  });

  it('shows add-ons in header if no specific addonType found with multiple authors', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(addonsWithAuthorsOfType({
      addonType: ADDON_TYPE_OPENSEARCH,
      multipleAuthors: true,
    }));

    const root = render({
      addonType: ADDON_TYPE_OPENSEARCH,
      authorNames: [fakeAuthor.username, 'secondAuthor'],
      errorHandler,
      store,
    });

    expect(root.find(AddonsCard))
      .toHaveProp('header', 'More add-ons by these developers');
  });
});
