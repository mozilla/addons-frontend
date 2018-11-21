import * as React from 'react';

import { createInternalAddon, loadAddonResults } from 'core/reducers/addons';
import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import GuidesAddonCard from 'amo/components/GuidesAddonCard';
import HeadLinks from 'amo/components/HeadLinks';
import { fetchGuidesAddons } from 'amo/reducers/guides';
import Guides, {
  extractId,
  GuidesBase,
  getContent,
  getSections,
} from 'amo/pages/Guides';
import { getLocalizedTextWithLinkParts } from 'core/utils/i18n';
import {
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const getProps = ({
    store = dispatchClientMetadata().store,
    i18n = fakeI18n(),
    slug = 'stay-safe-online',
    match = {
      params: {
        slug,
      },
    },
    ...customProps
  } = {}) => {
    return {
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

  const _loadAddonResults = (store, addon = fakeAddon) => {
    store.dispatch(
      loadAddonResults({
        addons: [addon],
      }),
    );
  };

  it('fetches guides addons', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    render({ errorHandler, store });

    const content = getContent('stay-safe-online', fakeI18n());
    const guids = content.sections.map((section) => section.addonGuid);

    sinon.assert.calledWith(
      dispatchSpy,
      fetchGuidesAddons({
        guids,
        errorHandlerId: errorHandler.id,
      }),
    );

    sinon.assert.calledOnce(dispatchSpy);
  });

  it('does not fetch guides addons while loading', () => {
    const { store } = dispatchClientMetadata();
    const slug = 'privacy';
    const errorHandler = createStubErrorHandler();
    const sections = getSections(slug, fakeI18n());
    const guids = sections.map((section) => section.addonGuid);

    // This simulates the initial fetch for addons.
    store.dispatch(
      fetchGuidesAddons({
        guids,
        errorHandlerId: errorHandler.id,
      }),
    );

    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not fetch guides addons if addons has already been set', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    const guid = 'test';
    const addons = {
      [guid]: {},
    };

    // This simulates the initial fetch for addons.
    store.dispatch(
      fetchGuidesAddons({
        guids: [guid],
        errorHandlerId: errorHandler.id,
      }),
    );

    // This simulates loading addons which updates the loading state.
    _loadAddonResults(store);

    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ store, addons });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('renders a Guides Page', () => {
    const slug = 'stay-safe-online';
    const content = getContent(slug, fakeI18n());
    const guids = content.sections.map((section) => section.addonGuid);

    const linkParts = getLocalizedTextWithLinkParts({
      i18n: fakeI18n(),
      text: content.sections[0].exploreMore,
    });

    const root = render({ content, slug });

    expect(root.find('.Guides')).toHaveLength(1);

    expect(root.find('.Guides-header-icon')).toHaveLength(1);

    const pageTitle = root.find('.Guides-header-page-title');
    expect(pageTitle).toHaveLength(1);
    expect(pageTitle.text()).toEqual(content.title);

    const pageIntro = root.find('.Guides-header-intro');
    expect(pageIntro).toHaveLength(1);
    expect(pageIntro.text()).toEqual(content.introText);

    expect(root.find('.Guides-section')).toHaveLength(guids.length);

    const sectionDescription = root.find('.Guides-section-description').at(0);

    expect(sectionDescription.children().text()).toEqual(
      content.sections[0].description,
    );

    const sectionHeaderTitle = root.find('.Guides-section-title').at(0);

    expect(sectionHeaderTitle.children().text()).toEqual(
      content.sections[0].header,
    );

    const sectionExploreMore = root.find('.Guides-section-explore-more').at(0);

    expect(sectionExploreMore.childAt(0).text()).toEqual(
      linkParts.beforeLinkText,
    );

    const sectionExploreLink = sectionExploreMore.find(Link);

    expect(sectionExploreLink.children().text()).toEqual(
      linkParts.innerLinkText,
    );

    expect(sectionExploreMore.childAt(2).text()).toEqual(
      linkParts.afterLinkText,
    );
  });

  it('passes an addon to GuidesAddonCard', () => {
    const { store } = dispatchClientMetadata();
    const slug = 'stay-safe-online';
    const guids = getSections({ slug, i18n: fakeI18n() }).map(
      (section) => section.addonGuid,
    );

    const errorHandler = createStubErrorHandler();
    const addon = {
      ...fakeAddon,
      guid: guids[0],
    };

    // This simulates the initial fetch for addons.
    store.dispatch(
      fetchGuidesAddons({
        guids,
        errorHandlerId: errorHandler.id,
      }),
    );

    _loadAddonResults(store, addon);

    const root = render({ store, slug });

    expect(root.find(GuidesAddonCard)).toHaveLength(guids.length);
    expect(root.find(GuidesAddonCard).at(0)).toHaveProp(
      'addon',
      createInternalAddon(addon),
    );
  });

  it('renders an HTML title', () => {
    const content = getContent('stay-safe-online', fakeI18n());
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
