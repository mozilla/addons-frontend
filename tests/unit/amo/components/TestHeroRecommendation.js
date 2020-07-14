import * as React from 'react';

import AppBanner from 'amo/components/AppBanner';
import HeroRecommendation, {
  PRIMARY_HERO_CLICK_CATEGORY,
  PRIMARY_HERO_SRC,
  HeroRecommendationBase,
} from 'amo/components/HeroRecommendation';
import { createInternalHeroShelves } from 'amo/reducers/home';
import { addParamsToHeroURL, getAddonURL } from 'amo/utils';
import { loadSiteStatus } from 'core/reducers/site';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import {
  createFakeEvent,
  createFakeTracking,
  createHeroShelves,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakePrimaryHeroShelfExternal,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const createShelfData = (primaryProps = {}) => {
    return createInternalHeroShelves(createHeroShelves({ primaryProps }))
      .primary;
  };

  const render = (moreProps = {}) => {
    const props = {
      errorHandler: createStubErrorHandler(),
      i18n: fakeI18n(),
      store: dispatchClientMetadata().store,
      ...moreProps,
    };
    return shallowUntilTarget(
      <HeroRecommendation {...props} />,
      HeroRecommendationBase,
    );
  };

  describe('for an addon', () => {
    it('renders a heading', () => {
      const addon = fakeAddon;
      const shelfData = createShelfData({ addon });

      const root = render({ shelfData });

      expect(root.find('.HeroRecommendation-heading')).toHaveText(addon.name);
    });

    it('renders a link', () => {
      const slug = 'some-addon-slug';
      const shelfData = createShelfData({ addon: { ...fakeAddon, slug } });

      const root = render({ shelfData });

      expect(root.find('.HeroRecommendation-link')).toHaveProp(
        'to',
        root.instance().makeCallToActionURL(),
      );
    });
  });

  describe('for an external item', () => {
    it('renders a heading', () => {
      const name = 'External Name';
      const shelfData = createShelfData({
        external: { ...fakePrimaryHeroShelfExternal, name },
      });

      const root = render({ shelfData });

      expect(root.find('.HeroRecommendation-heading')).toHaveText(name);
    });

    it('renders a link', () => {
      const homepage = 'https://somehomepage.com';
      const shelfData = createShelfData({
        external: { ...fakePrimaryHeroShelfExternal, homepage },
      });

      const root = render({ shelfData });

      expect(root.find('.HeroRecommendation-link')).toHaveProp(
        'href',
        root.instance().makeCallToActionURL(),
      );
    });

    it('configures an external link to open in a new tab', () => {
      const _checkInternalURL = sinon.stub().returns({ isInternal: false });
      const external = fakePrimaryHeroShelfExternal;
      const shelfData = createShelfData({ external });

      const root = render({ _checkInternalURL, shelfData });

      const link = root.find('.HeroRecommendation-link');
      expect(link).toHaveProp('rel', 'noopener noreferrer');
      expect(link).toHaveProp('target', '_blank');
      sinon.assert.calledWith(
        _checkInternalURL,
        sinon.match({ urlString: sinon.match(external.homepage) }),
      );
    });

    it('does not configure an internal link to open in a new tab', () => {
      const _checkInternalURL = sinon.stub().returns({ isInternal: true });
      const external = fakePrimaryHeroShelfExternal;
      const shelfData = createShelfData({ external });

      const root = render({ _checkInternalURL, shelfData });

      const link = root.find('.HeroRecommendation-link');
      expect(link).not.toHaveProp('rel');
      expect(link).not.toHaveProp('target');
      sinon.assert.calledWith(
        _checkInternalURL,
        sinon.match({ urlString: sinon.match(external.homepage) }),
      );
    });
  });

  it('renders with an image', () => {
    const featuredImage = 'https://mozilla.org/featured.png';
    const shelfData = createShelfData({ addon: fakeAddon, featuredImage });

    const root = render({ shelfData });

    expect(root).not.toHaveClassName('HeroRecommendation--no-image');
    expect(root.find('.HeroRecommendation-image')).toHaveProp(
      'src',
      featuredImage,
    );
  });

  it('renders without an image', () => {
    const featuredImage = null;
    const shelfData = createShelfData({ addon: fakeAddon, featuredImage });

    const root = render({ shelfData });

    expect(root).toHaveClassName('HeroRecommendation--no-image');
    expect(root.find('.HeroRecommendation-image')).toHaveLength(0);
  });

  it('assigns a className based on the gradient', () => {
    const gradient = { start: 'start-color', end: 'stop-color' };
    const shelfData = createShelfData({ addon: fakeAddon, gradient });

    const root = render({ shelfData });

    expect(root).toHaveClassName('HeroRecommendation');
    expect(root).toHaveClassName(
      `HeroRecommendation-${gradient.start}-${gradient.end}`,
    );
  });

  it('renders a body', () => {
    const description = 'some body text';
    const shelfData = createShelfData({ addon: fakeAddon, description });

    const root = render({ shelfData });

    expect(root.find('.HeroRecommendation-body').html()).toContain(description);
  });

  it('allows some html tags in the body', () => {
    const description = '<blockquote><b>Some body text</b></blockquote>';
    const shelfData = createShelfData({ addon: fakeAddon, description });

    const root = render({ shelfData });

    expect(root.find('.HeroRecommendation-body').html()).toContain(description);
  });

  it('sanitizes html tags in the body', () => {
    const description = '<blockquote><b>Some body text</b></blockquote>';
    const scriptHtml = '<script>alert(document.cookie);</script>';
    const shelfData = createShelfData({
      addon: fakeAddon,
      description: `${description}${scriptHtml}`,
    });

    const root = render({ shelfData });

    expect(root.find('.HeroRecommendation-body').html()).toContain(description);
  });

  it('renders an AppBanner', () => {
    const root = render();

    expect(root.find(AppBanner)).toHaveLength(1);
  });

  it('renders an error if present', () => {
    const errorHandler = createStubErrorHandler(new Error('some error'));

    const root = render({ errorHandler });
    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it.each([
    { readOnly: true, notice: null },
    { readOnly: false, notice: 'some notice' },
    { readOnly: true, notice: 'some notice' },
  ])(
    'assigns the expected class when an AppBanner is present, status: %s',
    (status) => {
      const { store } = dispatchClientMetadata();
      store.dispatch(loadSiteStatus(status));

      const root = render({ store });

      expect(root).toHaveClassName('HeroRecommendation--height-with-notice');
    },
  );

  it('assigns the expected class when an AppBanner is not present', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadSiteStatus({ readOnly: false, notice: null }));

    const root = render({ store });

    expect(root).toHaveClassName('HeroRecommendation--height-without-notice');
  });

  it('renders in a loading state', () => {
    const root = render();

    expect(root).toHaveClassName('HeroRecommendation--loading');
    expect(root.find(LoadingText)).toHaveLength(4);
  });

  describe('makeCallToActionURL', () => {
    it('creates a URL for an addon', () => {
      const slug = 'some-addon-slug';
      const shelfData = createShelfData({ addon: { ...fakeAddon, slug } });

      const root = render({ shelfData });

      expect(root.instance().makeCallToActionURL()).toEqual(
        addParamsToHeroURL({
          heroSrcCode: PRIMARY_HERO_SRC,
          urlString: getAddonURL(slug),
        }),
      );
    });

    it('creates a URL for an external entry', () => {
      const homepage = 'https://somehomepage.com';
      const shelfData = createShelfData({
        external: { ...fakePrimaryHeroShelfExternal, homepage },
      });

      const root = render({ shelfData });

      expect(root.instance().makeCallToActionURL()).toEqual(
        addParamsToHeroURL({
          heroSrcCode: PRIMARY_HERO_SRC,
          urlString: homepage,
        }),
      );
    });
  });

  describe('tracking', () => {
    const withAddonShelfData = createShelfData({ addon: fakeAddon });
    const withExternalShelfData = createShelfData({
      external: fakePrimaryHeroShelfExternal,
    });

    it.each([
      ['addon', withAddonShelfData],
      ['external', withExternalShelfData],
    ])(
      'sends a tracking event when the cta is clicked for %s',
      (feature, shelfData) => {
        const _tracking = createFakeTracking();

        const root = render({ _tracking, shelfData });

        const event = createFakeEvent();
        root.find('.HeroRecommendation-link').simulate('click', event);

        sinon.assert.calledWith(_tracking.sendEvent, {
          action: root.instance().makeCallToActionURL(),
          category: PRIMARY_HERO_CLICK_CATEGORY,
        });
        sinon.assert.calledOnce(_tracking.sendEvent);
      },
    );
  });
});
