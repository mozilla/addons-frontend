import { oneLine } from 'common-tags';
import * as React from 'react';

import NotFound from 'amo/components/ErrorPage/NotFound';
import HeadLinks from 'amo/components/HeadLinks';
import { fetchGuidesAddons } from 'amo/reducers/guides';
import {
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Guides, { extractId, GuidesBase, getContent } from 'amo/pages/Guides';

describe(__filename, () => {
  const getProps = ({
    store = dispatchClientMetadata().store,
    i18n = fakeI18n(),
    dispatch = store.dispatch,
    slug = 'privacy',
    content = getContent('privacy', i18n),
    match = {
      params: {
        slug,
      },
    },
    ...customProps
  } = {}) => {
    return {
      content,
      dispatch,
      i18n,
      match,
      slug,
      store,
      ...customProps,
    };
  };

  const render = ({ ...customProps } = {}) => {
    const allProps = getProps(customProps);

    return shallowUntilTarget(<Guides {...allProps} />, GuidesBase);
  };

  it('fetches guides addons', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = render({ dispatch: dispatchSpy, store });

    const content = getContent('privacy', fakeI18n());
    const guids = content.sections.map((section) => section.addonGuid);

    sinon.assert.calledWith(
      dispatchSpy,
      fetchGuidesAddons({
        guids,
        errorHandlerId: root.instance().props.errorHandler.id,
      }),
    );
  });

  it('renders a Guides Page', () => {
    const slug = 'privacy';
    const content = getContent(slug, fakeI18n());
    const root = render({ content, slug });

    expect(root.find('title')).toHaveText(content.title);

    expect(root.find(HeadLinks)).toHaveLength(1);

    expect(root.find('.Guides')).toHaveLength(1);
    expect(root.find('.Guides-header-icon')).toHaveLength(1);
    expect(root.find('.Guides-header-page-title')).toHaveLength(1);
    expect(root.find('.Guides-header-intro')).toHaveLength(1);

    expect(root.find('.Guides-section')).toHaveLength(1);
    expect(root.find('.Guides-section-title').text()).toContain(
      'Create and manage strong passwords',
    );
    expect(root.find('.Guides-section-description').text()).toContain(
      'Password managers can help you',
    );
    expect(root.find('.Guides-section-explore-more')).toHaveHTML(
      oneLine`<div class="Guides-section-explore-more">Explore more
      <a href="/en-US/android/collections/mozilla/password-managers/"
      class="Guides-section-explore-more-link">password manager</a> staff picks.</div>`,
    );
  });

  it('renders a 404 component when there are no matching guides params', () => {
    const root = render({ match: { params: { slug: 'bad-slug' } } });

    expect(root.find('.Guides')).toHaveLength(0);
    expect(root.find(NotFound)).toHaveLength(1);
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
