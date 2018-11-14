import { oneLine } from 'common-tags';
import * as React from 'react';

import NotFound from 'amo/components/ErrorPage/NotFound';
import GuidesAddonCard from 'amo/components/GuidesAddonCard';
import HeadLinks from 'amo/components/HeadLinks';
import { fetchGuidesAddons } from 'amo/reducers/guides';
import Guides, { extractId, GuidesBase, getContent } from 'amo/pages/Guides';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const getProps = ({
    addon = fakeAddon,
    addons = { '{446900e4-71c2-419f-a6a7-df9c091e268b}': addon },
    store = dispatchClientMetadata().store,
    i18n = fakeI18n(),
    dispatch = store.dispatch,
    slug = 'privacy',
    content = getContent(slug, i18n),
    match = {
      params: {
        slug,
      },
    },
    ...customProps
  } = {}) => {
    return {
      addons,
      addon,
      content,
      dispatch,
      i18n,
      match,
      slug,
      store,
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
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
    const addon = fakeAddon;
    const slug = 'privacy';
    const content = getContent(slug, fakeI18n());
    const guids = content.sections.map((section) => section.addonGuid);

    const addons = {
      [guids[0]]: addon,
    };

    const root = render({ content, slug });

    expect(root.find('.Guides')).toHaveLength(1);

    expect(root.find('.Guides-header-icon')).toHaveLength(1);

    const pageTitle = root.find('.Guides-header-page-title');
    expect(pageTitle).toHaveLength(1);
    expect(pageTitle.text()).toEqual(content.title);

    const pageIntro = root.find('.Guides-header-intro');
    expect(pageIntro).toHaveLength(1);
    expect(pageIntro.text()).toEqual(content.introText);

    expect(root.find('.Guides-section')).toHaveLength(1);

    const sectionDescription = root.find('.Guides-section-description').at(0);

    expect(sectionDescription.children().text()).toEqual(
      content.sections[0].description,
    );

    const sectionHeaderTitle = root.find('.Guides-section-title').at(0);

    expect(sectionHeaderTitle.children().text()).toEqual(
      content.sections[0].header,
    );

    const sectionExploreLink = root.find('.Guides-section-explore-more').at(0);

    expect(sectionExploreLink).toHaveHTML(
      oneLine`<div class="Guides-section-explore-more">Explore more
      <a href="/en-US/android/collections/mozilla/password-managers/"
      class="Guides-section-explore-more-link">password manager</a> staff picks.</div>`,
    );

    root.setProps({ addons });

    expect(root.find(GuidesAddonCard)).toHaveLength(guids.length);
    expect(root.find(GuidesAddonCard)).toHaveProp('addon', addon);
  });

  it('renders an HTML title', () => {
    const content = getContent('privacy', fakeI18n());
    const root = render({ content });

    expect(root.find('title')).toHaveText(content.title);
  });

  it('renders a HeadLinks component', () => {
    const root = render();

    expect(root.find(HeadLinks)).toHaveLength(1);
  });

  it('renders a 404 component when there are no matching guides params', () => {
    const root = render({ match: { params: { slug: 'bad-slug' } } });

    expect(root.find('.Guides')).toHaveLength(0);
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it(`renders a 404 component when content is null`, () => {
    const root = render({ content: null, slug: null });

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
