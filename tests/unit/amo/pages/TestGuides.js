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
  const render = ({ slug = 'organize-your-tabs', ...props } = {}) => {
    const allProps = {
      store: dispatchClientMetadata().store,
      i18n: fakeI18n(),
      match: {
        params: {
          slug,
        },
      },
      ...props,
    };

    return shallowUntilTarget(<Guides {...allProps} />, GuidesBase);
  };

  const _loadAddonResults = (store, addon = fakeAddon) => {
    store.dispatch(
      loadAddonResults({
        addons: [addon],
      }),
    );
  };

  it('fetches the addons for a guide page', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const slug = 'stay-safe-online';
    const content = getContent(slug, fakeI18n());
    const guids = content.sections.map((section) => section.addonGuid);

    render({ errorHandler, store, slug });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchGuidesAddons({
        slug,
        guids,
        errorHandlerId: errorHandler.id,
      }),
    );

    sinon.assert.calledOnce(dispatchSpy);
  });

  it('does not fetch the addons while loading', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();

    const slug = 'stay-safe-online';
    const content = getContent(slug, fakeI18n());
    const guids = content.sections.map((section) => section.addonGuid);

    // This simulates the initial fetch for addons.
    store.dispatch(
      fetchGuidesAddons({
        slug,
        guids,
        errorHandlerId: errorHandler.id,
      }),
    );

    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ store, slug });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not fetch the addons if addons have already been loaded', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();

    const slug = 'stay-safe-online';
    const content = getContent(slug, fakeI18n());
    const guids = content.sections.map((section) => section.addonGuid);
    const addons = [];

    // Fetch/load an empty list of addons.
    store.dispatch(
      fetchGuidesAddons({
        slug,
        guids,
        errorHandlerId: errorHandler.id,
      }),
    );
    store.dispatch(loadAddonResults({ addons }));

    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ store, slug });

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
        slug,
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
    const slug = 'stay-safe-online';
    const root = render({ slug });

    const content = getContent(slug, fakeI18n());
    expect(root.find('title')).toHaveText(content.title);
  });

  it('renders a HeadLinks component', () => {
    const root = render();

    expect(root.find(HeadLinks)).toHaveLength(1);
  });

  it('renders a 404 component when the slug is invalid', () => {
    const root = render({ slug: 'bad-slug' });

    expect(root.find('.Guides')).toHaveLength(0);
    expect(root.find(NotFound)).toHaveLength(1);
  });

  describe('extractId', () => {
    it('returns a unique ID based on the guides slug', () => {
      const ownProps = {
        match: {
          params: { slug: 'foobar' },
        },
      };

      expect(extractId(ownProps)).toEqual('foobar');
    });
  });
});
