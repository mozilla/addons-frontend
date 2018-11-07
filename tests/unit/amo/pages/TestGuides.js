import * as React from 'react';

import NotFound from 'amo/components/ErrorPage/NotFound';
import { fetchGuidesAddons } from 'amo/reducers/guides';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Guides, { extractId, GuidesBase, getContent } from 'amo/pages/Guides';

describe(__filename, () => {
  let content;
  let store;
  let slug;
  let i18n;
  let guids;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
    slug = 'privacy';
    i18n = fakeI18n();
    content = getContent(slug, i18n);
    guids = content.sections.map((section) => section.addonGuid);
  });

  const getProps = ({
    addons = Array(3).fill(fakeAddon),
    dispatch = store.dispatch,
    match = {
      params: {
        slug,
      },
    },
    ...customProps
  } = {}) => {
    return {
      addons,
      dispatch,
      i18n,
      match,
      store,
      ...customProps,
    };
  };

  const render = ({ ...customProps } = {}) => {
    const allProps = getProps(customProps);

    return shallowUntilTarget(<Guides {...allProps} />, GuidesBase);
  };

  it('fetches guides addons', () => {
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ dispatch: dispatchSpy });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchGuidesAddons({
        guids,
        errorHandlerId: root.instance().props.errorHandler.id,
      }),
    );
  });

  it('renders a Guides Page', () => {
    const root = render();

    expect(root.find('title')).toHaveText(content.title);
    expect(root.find('.Guides')).toHaveLength(1);
    expect(root.find('.Guides-header-icon')).toHaveLength(1);
    expect(root.find('.Guides-header-page-title')).toHaveLength(1);
    expect(root.find('.Guides-header-intro')).toHaveLength(1);

    const addonsCount = guids.length;

    expect(root.find('.Guides-section')).toHaveLength(addonsCount);
  });

  it('renders a 404 component when there are no matching guides params', () => {
    const root = render({ match: { params: { slug: 'bad-slug' } } });

    expect(root.find('.Guides')).toHaveLength(0);
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('does not render Guides sections when addons are null', () => {
    const root = render({ addons: [] });

    expect(root.find('.Guides')).toHaveLength(1);

    expect(root.find('.Guide-section')).toHaveLength(0);
  });

  describe('extractId', () => {
    it('returns a unique ID based on the guides slug', () => {
      const ownProps = getProps({
        match: {
          params: { slug: 'foobar' },
        },
      });

      expect(extractId(ownProps)).toEqual(`foobar`);
    });
  });
});
