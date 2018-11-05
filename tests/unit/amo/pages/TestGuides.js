import * as React from 'react';

import GuidesAddonCard from 'amo/components/GuidesAddonCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import { fetchGuidesAddons } from 'amo/reducers/guides';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Guides, { GuidesBase, getContent, getGuids } from 'amo/pages/Guides';

describe(__filename, () => {
  let store;
  let guidesSlug;
  let i18n;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
    guidesSlug = 'privacy';
    i18n = fakeI18n();
  });

  const render = ({
    addons = Array(3).fill(fakeAddon),
    dispatch = store.dispatch,
    match = {
      params: {
        guidesSlug,
      },
    },
    ...customProps
  } = {}) => {
    const allProps = {
      addons,
      dispatch,
      i18n,
      match,
      store,
      ...customProps,
    };

    return shallowUntilTarget(<Guides {...allProps} />, GuidesBase);
  };

  it('fetches guides addons', () => {
    const dispatchSpy = sinon.spy(store, 'dispatch');
    render({ dispatch: dispatchSpy });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchGuidesAddons({
        guids: getGuids(guidesSlug, i18n),
        errorHandlerId: guidesSlug,
      }),
    );
  });

  it('renders a Guides Page', () => {
    const root = render();
    const sectionSample = getContent(guidesSlug, i18n);

    expect(root.find('title')).toHaveText(sectionSample.title);
    expect(root.find('.Guides')).toHaveLength(1);
    expect(root.find('.Guides-header-icon')).toHaveLength(1);
    expect(root.find('.Guides-header-page-title')).toHaveLength(1);
    expect(root.find('.Guides-header-intro')).toHaveLength(1);

    const addonsCount = getGuids(guidesSlug).length;
    const addons = Array(addonsCount).fill(fakeAddon);

    // This simulates mapStateToProps which sets up addons asynchronously.
    root.setProps({ addons });

    expect(root.find('.Guides-section')).toHaveLength(addonsCount);
    expect(root.find(GuidesAddonCard)).toHaveLength(addonsCount);
  });

  it('renders a 404 component when there are no matching guides params', () => {
    const root = render({ match: { params: { guidesSlug: 'bad-slug' } } });

    expect(root.find('.Guides')).toHaveLength(0);
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('does not render Guides sections when addons are null', () => {
    const root = render({ addons: [] });

    expect(root.find('.Guides')).toHaveLength(1);

    // This simulates mapStateToProps which sets up addons asynchronously.
    root.setProps();

    expect(root.find('.Guide-section')).toHaveLength(0);
  });
});
