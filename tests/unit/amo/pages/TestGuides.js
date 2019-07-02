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
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'core/constants';
import {
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  getFakeLogger,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ slug = 'organize-tabs-and-bookmarks', ...props } = {}) => {
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

  const _loadAddonResults = ({ store, addons = [fakeAddon] } = {}) => {
    store.dispatch(
      loadAddonResults({
        addons,
      }),
    );
  };

  const _dispatchFirefoxClient = (params = {}) => {
    return dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      ...params,
    });
  };

  describe('CLIENT_APP_FIREFOX', () => {
    it('fetches the add-ons for a guide page', () => {
      const { store } = _dispatchFirefoxClient();

      const dispatchSpy = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      const slug = 'stay-safe-online';
      const content = getContent({ slug, i18n: fakeI18n() });
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
      const { store } = _dispatchFirefoxClient();

      const errorHandler = createStubErrorHandler();
      const slug = 'stay-safe-online';
      const content = getContent({ slug, i18n: fakeI18n() });
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

      render({ store });

      sinon.assert.notCalled(dispatchSpy);
    });

    it('does not fetch the add-ons if add-ons have already been loaded', () => {
      const { store } = _dispatchFirefoxClient();

      const errorHandler = createStubErrorHandler();
      const slug = 'stay-safe-online';
      const content = getContent({ slug, i18n: fakeI18n() });
      const guids = content.sections.map((section) => section.addonGuid);
      const addons = [];

      // Fetch/load an empty list of add-ons.
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
      const { store } = _dispatchFirefoxClient();

      const slug = 'stay-safe-online';
      const content = getContent({ slug, i18n: fakeI18n() });
      const guids = content.sections.map((section) => section.addonGuid);

      const root = render({ slug, store });

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

      // Each `exploreMore` sentence has the following form: `Explore more
      // %(linkStart)ssomething%(linkEnd)s staff picks.`, so we split on i18n
      // placeholders to get the different parts.
      const exploreMoreParts = content.sections[0].exploreMore.split(
        /%\(\w+\)s/,
      );

      const sectionExploreMore = root
        .find('.Guides-section-explore-more')
        .at(0);
      expect(sectionExploreMore.text()).toContain(exploreMoreParts[0]);
      expect(sectionExploreMore.text()).toContain(exploreMoreParts[2]);

      const sectionExploreMoreLink = sectionExploreMore.find(Link);
      expect(sectionExploreMoreLink).toHaveLength(1);
      expect(sectionExploreMoreLink).toHaveProp(
        'to',
        content.sections[0].exploreUrl,
      );
      expect(sectionExploreMoreLink).toHaveProp(
        'children',
        exploreMoreParts[1],
      );
    });

    it('passes a valid addon to GuidesAddonCard', () => {
      const { store } = _dispatchFirefoxClient();
      const _log = getFakeLogger();

      const slug = 'stay-safe-online';

      const guids = getSections({ slug, i18n: fakeI18n() }).map(
        (section) => section.addonGuid,
      );

      const addons = [];

      guids.forEach((guid, index) => {
        addons.push({
          ...fakeAddon,
          id: index,
          guid,
        });
      });

      const errorHandler = createStubErrorHandler();

      // This simulates the initial fetch for addons.
      store.dispatch(
        fetchGuidesAddons({
          slug,
          guids,
          errorHandlerId: errorHandler.id,
        }),
      );

      _loadAddonResults({ store, addons });

      const root = render({ _log, store, slug });

      addons.forEach((addon, index) => {
        expect(root.find(GuidesAddonCard).at(index)).toHaveProp(
          'addon',
          createInternalAddon(addon),
        );
      });

      sinon.assert.notCalled(_log.error);
    });

    it('passes addon value as `null` to GuidesAddonCard and logs an error when the GUID is not valid', () => {
      const { store } = _dispatchFirefoxClient();
      const i18n = fakeI18n();

      const slug = 'stay-safe-online';
      const guids = ['bad@guid.com'];

      const _log = getFakeLogger();

      const fakeSections = [
        {
          addonGuid: guids[0],
          header: i18n.gettext('Addon header text'),
          description: i18n.gettext('Addon description text'),
          addonCustomText: i18n.gettext('Custom Addon Text'),
          exploreMore: i18n.gettext('Explore %(linkStart)smore%(linkEnd)s.'),
          exploreUrl: '/some/url',
        },
      ];

      const errorHandler = createStubErrorHandler();

      // This simulates the initial fetch for addons.
      store.dispatch(
        fetchGuidesAddons({
          slug,
          guids,
          errorHandlerId: errorHandler.id,
        }),
      );

      // This updates the loading state.
      _loadAddonResults({ store, addons: [fakeAddon] });

      const root = render({ _log, _sections: fakeSections, store, slug });

      expect(root.find(GuidesAddonCard).at(0)).toHaveProp('addon', null);
      sinon.assert.calledWith(
        _log.error,
        `Could not load add-on with GUID: ${guids[0]}`,
      );
    });

    it.each([['does', 'not empty'], ['does not', 'empty']])(
      `%s display exploreMore details when a section's exploreMore text is %s`,
      (expectation, exploreMoreStatus) => {
        const { store } = _dispatchFirefoxClient();

        const slug = 'stay-safe-online';
        const section = getSections({ slug, i18n: fakeI18n() })[0];
        const { addonGuid } = section;
        const addons = [{ ...fakeAddon, addonGuid, slug }];

        const expectedLength = expectation === 'does' ? 1 : 0;

        if (exploreMoreStatus === 'empty') {
          section.exploreMore = undefined;
        }

        store.dispatch(
          fetchGuidesAddons({
            slug,
            guids: [addonGuid],
            errorHandlerId: createStubErrorHandler().id,
          }),
        );

        _loadAddonResults({ store, addons });

        const root = render({ _sections: [section], store, slug });

        expect(root.find('.Guides-section-explore-more')).toHaveLength(
          expectedLength,
        );
      },
    );

    it('renders an HTML title', () => {
      const { store } = _dispatchFirefoxClient();

      const slug = 'stay-safe-online';
      const root = render({ slug, store });

      const content = getContent({ slug, i18n: fakeI18n() });
      expect(root.find('title')).toHaveText(content.title);
    });

    it('renders a HeadLinks component', () => {
      const { store } = _dispatchFirefoxClient();

      const root = render({ store });

      expect(root.find(HeadLinks)).toHaveLength(1);
    });

    it('renders a 404 component when the slug is invalid', () => {
      const { store } = _dispatchFirefoxClient();

      const root = render({ slug: 'bad-slug', store });

      expect(root.find('.Guides')).toHaveLength(0);
      expect(root.find(NotFound)).toHaveLength(1);
    });
  });

  describe('CLIENT_APP_ANDROID', () => {
    it('does not fetch the add-ons for a guide page', () => {
      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
      });
      const dispatchSpy = sinon.spy(store, 'dispatch');

      render({ store });

      sinon.assert.notCalled(dispatchSpy);
    });

    it('renders a 404 component ', () => {
      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
      });

      const root = render({ store });

      expect(root.find('.Guides')).toHaveLength(0);
      expect(root.find(NotFound)).toHaveLength(1);
    });
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
