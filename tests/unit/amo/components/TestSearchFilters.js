import React from 'react';

import SearchFilters, {
  SearchFiltersBase,
} from 'amo/components/SearchFilters';
import { searchStart } from 'core/actions/search';
import { ADDON_TYPE_EXTENSION, OS_LINUX } from 'core/constants';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  createStubErrorHandler,
  getFakeI18nInst,
  shallowUntilTarget,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let fakeRouter;

  function render({
    filters = {},
    pathname = '/search/',
    ...props
  } = {}) {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();

    store.dispatch(searchStart({ errorHandlerId: errorHandler.id, filters }));

    return shallowUntilTarget(
      <SearchFilters
        i18n={getFakeI18nInst()}
        pathname={pathname}
        router={fakeRouter}
        store={store}
        {...props}
      />,
      SearchFiltersBase
    );
  }

  beforeEach(() => {
    fakeRouter = { push: sinon.stub() };
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

    sinon.assert.calledWithExactly(fakeRouter.push, {
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

    sinon.assert.calledWithExactly(fakeRouter.push, {
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

    sinon.assert.calledWithExactly(fakeRouter.push, {
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

    sinon.assert.notCalled(fakeRouter.push);
  });
});
