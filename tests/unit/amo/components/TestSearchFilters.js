import * as React from 'react';

import SearchFilters, { SearchFiltersBase } from 'amo/components/SearchFilters';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEMES_FILTER,
  OS_LINUX,
} from 'core/constants';
import { searchStart } from 'core/reducers/search';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import Select from 'ui/components/Select';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeHistory,
  createStubErrorHandler,
  fakeI18n,
  createFakeLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let fakeHistory;

  function render({ filters = {}, pathname = '/search/', ...props } = {}) {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();

    store.dispatch(searchStart({ errorHandlerId: errorHandler.id, filters }));

    return shallowUntilTarget(
      <SearchFilters
        i18n={fakeI18n()}
        pathname={pathname}
        store={store}
        {...props}
      />,
      SearchFiltersBase,
      {
        shallowOptions: createContextWithFakeRouter({
          history: fakeHistory,
          location: createFakeLocation({ pathname }),
        }),
      },
    );
  }

  beforeEach(() => {
    fakeHistory = createFakeHistory();
  });

  it('renders a SearchFilters component', () => {
    const root = render();

    expect(root.find('.SearchFilters')).toHaveLength(1);
  });

  it('changes the URL when a new addonType filter is selected', () => {
    const root = render({ filters: { query: 'Music player' } });

    const select = root.find('.SearchFilters-AddonType');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: ADDON_TYPE_EXTENSION,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/android/search/`,
      query: convertFiltersToQueryParams({
        addonType: ADDON_TYPE_EXTENSION,
        query: 'Music player',
      }),
    });
  });

  it('changes the URL when a new OS filter is selected', () => {
    const root = render({ filters: { query: 'Music player' } });

    const select = root.find('.SearchFilters-OperatingSystem');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: OS_LINUX,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/android/search/`,
      query: convertFiltersToQueryParams({
        operatingSystem: OS_LINUX,
        query: 'Music player',
      }),
    });
  });

  it('deletes the filter if it is empty', () => {
    const root = render({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        query: 'Cool things',
      },
    });

    const select = root.find('.SearchFilters-AddonType');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: '',
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/android/search/`,
      query: convertFiltersToQueryParams({
        query: 'Cool things',
      }),
    });
  });

  it('does not change the URL when the same filter is selected', () => {
    const root = render({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        query: 'Music player',
      },
    });

    const select = root.find('.SearchFilters-AddonType');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: ADDON_TYPE_EXTENSION,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.notCalled(fakeHistory.push);
  });

  it('changes the URL when featured checkbox is checked', () => {
    const root = render({ filters: { query: 'Music player' } });

    const checkbox = root.find('.SearchFilters-Featured');
    checkbox.simulate('change', createFakeEvent());

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/android/search/`,
      query: convertFiltersToQueryParams({
        featured: true,
        query: 'Music player',
      }),
    });
  });

  it('deletes featured filter when checkbox is unchecked', () => {
    const root = render({
      filters: {
        featured: true,
        query: 'Music player',
      },
    });

    const checkbox = root.find('.SearchFilters-Featured');
    checkbox.simulate('change', createFakeEvent());

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/android/search/`,
      query: convertFiltersToQueryParams({
        query: 'Music player',
      }),
    });
  });

  it('resets the page filter when checkbox is checked', () => {
    const root = render({
      filters: {
        page: 42,
        query: 'Music player',
      },
    });

    const checkbox = root.find('.SearchFilters-Featured');
    checkbox.simulate('change', createFakeEvent());

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/android/search/`,
      query: convertFiltersToQueryParams({
        featured: true,
        page: 1,
        query: 'Music player',
      }),
    });
  });

  it('resets the page filter when checkbox is unchecked', () => {
    const root = render({
      filters: {
        featured: true,
        page: 42,
        query: 'Music player',
      },
    });

    const checkbox = root.find('.SearchFilters-Featured');
    checkbox.simulate('change', createFakeEvent());

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/android/search/`,
      query: convertFiltersToQueryParams({
        page: 1,
        query: 'Music player',
      }),
    });
  });

  it('resets the page filter when a select is updated', () => {
    const root = render({
      filters: {
        page: 42,
        query: 'Cool things',
      },
    });

    const select = root.find('.SearchFilters-AddonType');
    const currentTarget = {
      getAttribute: () => {
        return select.prop('name');
      },
      value: ADDON_TYPE_EXTENSION,
    };

    select.simulate('change', createFakeEvent({ currentTarget }));

    sinon.assert.calledWithExactly(fakeHistory.push, {
      pathname: `/en-US/android/search/`,
      query: convertFiltersToQueryParams({
        addonType: ADDON_TYPE_EXTENSION,
        page: 1,
        query: 'Cool things',
      }),
    });
  });

  it('does not display the addonType filter when a category is defined', () => {
    // See: https://github.com/mozilla/addons-frontend/issues/3747
    const root = render({ filters: { category: 'abstract' } });

    expect(root.find('.SearchFilters-AddonType')).toHaveLength(0);
  });

  it('sets themes filters shelf with the ADDON_TYPE_THEMES_FILTER filter', () => {
    const root = render();
    const selectFilters = root.find(Select);

    const optionValues = selectFilters
      .find('#SearchFilters-AddonType')
      .children()
      .map((option) => option.props().value);
    expect(optionValues).toContain(ADDON_TYPE_THEMES_FILTER);
  });
});
