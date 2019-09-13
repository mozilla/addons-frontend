import url from 'url';

import * as React from 'react';

import AddonTitle from 'amo/components/AddonTitle';
import HeroRecommendation, {
  PRIMARY_HERO_CLICK_CATEGORY,
  PRIMARY_HERO_SRC,
  addParamsToHeroURL,
  HeroRecommendationBase,
} from 'amo/components/HeroRecommendation';
import { createInternalAddon } from 'core/reducers/addons';
import { createInternalHeroShelves } from 'amo/reducers/home';
import { getAddonURL } from 'amo/utils';
import {
  createFakeEvent,
  createFakeTracking,
  createHeroShelves,
  fakeAddon,
  fakeI18n,
  fakePrimaryHeroShelfExternal,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const createShelfData = (primaryProps = {}) => {
    return createInternalHeroShelves(createHeroShelves({ primaryProps }))
      .primary;
  };

  const render = (moreProps = {}) => {
    const props = {
      i18n: fakeI18n(),
      shelfData: createShelfData({ addon: fakeAddon }),
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

      expect(root.find(AddonTitle)).toHaveProp(
        'addon',
        createInternalAddon(addon),
      );
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
      const _isInternalURL = sinon.stub().returns(false);
      const external = fakePrimaryHeroShelfExternal;
      const shelfData = createShelfData({ external });

      const root = render({ _isInternalURL, shelfData });

      const link = root.find('.HeroRecommendation-link');
      expect(link).toHaveProp('rel', 'noopener noreferrer');
      expect(link).toHaveProp('target', '_blank');
      sinon.assert.calledWith(
        _isInternalURL,
        sinon.match({ urlString: sinon.match(external.homepage) }),
      );
    });

    it('does not configure an internal link to open in a new tab', () => {
      const _isInternalURL = sinon.stub().returns(true);
      const slug = 'some-slug';
      const shelfData = createShelfData({
        addon: { ...fakeAddon, slug },
      });

      const root = render({ _isInternalURL, shelfData });

      const link = root.find('.HeroRecommendation-link');
      expect(link).not.toHaveProp('rel');
      expect(link).not.toHaveProp('target');
      sinon.assert.calledWith(
        _isInternalURL,
        sinon.match({ urlString: sinon.match(slug) }),
      );
    });
  });

  it('renders an image', () => {
    const featuredImage = 'https://mozilla.org/featured.png';
    const shelfData = createShelfData({ addon: fakeAddon, featuredImage });

    const root = render({ shelfData });

    expect(root.find('.HeroRecommendation-image')).toHaveProp(
      'src',
      featuredImage,
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

  describe('addParamsToHeroURL', () => {
    let _addQueryParams;
    let _isInternalURL;
    const urlString = '/path/name';
    const internalQueryParams = { internalParam1: 'internalParam1' };
    const externalQueryParams = { externalParam1: 'externalParam1' };

    beforeEach(() => {
      _addQueryParams = sinon.spy();
      _isInternalURL = sinon.stub();
    });

    it('passes internal query params to _addQueryParams for an internal URL', () => {
      _isInternalURL.returns(true);

      addParamsToHeroURL({
        _addQueryParams,
        _isInternalURL,
        externalQueryParams,
        internalQueryParams,
        urlString,
      });

      sinon.assert.calledWith(_addQueryParams, urlString, internalQueryParams);
    });

    it('passes default internal query params to _addQueryParams for an internal URL', () => {
      _isInternalURL.returns(true);

      addParamsToHeroURL({
        _addQueryParams,
        _isInternalURL,
        urlString,
      });

      sinon.assert.calledWith(_addQueryParams, urlString, {
        src: PRIMARY_HERO_SRC,
      });
    });

    it('allows for override of heroSrcCode for an internal URL', () => {
      const heroSrcCode = 'test-src-code';
      _isInternalURL.returns(true);

      addParamsToHeroURL({
        _addQueryParams,
        _isInternalURL,
        heroSrcCode,
        urlString,
      });

      sinon.assert.calledWith(_addQueryParams, urlString, {
        src: heroSrcCode,
      });
    });

    it('passes external query params to _addQueryParams for an external URL', () => {
      _isInternalURL.returns(false);

      addParamsToHeroURL({
        _addQueryParams,
        _isInternalURL,
        externalQueryParams,
        internalQueryParams,
        urlString,
      });

      sinon.assert.calledWith(_addQueryParams, urlString, externalQueryParams);
    });

    it('passes default external query params to _addQueryParams for an external URL', () => {
      const baseURL = 'https://example.org';
      const _config = getFakeConfig({ baseURL });
      _isInternalURL.returns(false);

      addParamsToHeroURL({
        _addQueryParams,
        _config,
        _isInternalURL,
        urlString,
      });

      sinon.assert.calledWith(_addQueryParams, urlString, {
        utm_content: PRIMARY_HERO_SRC,
        utm_medium: 'referral',
        utm_source: url.parse(baseURL).host,
      });
    });

    it('allows for override of heroSrcCode for an external URL', () => {
      const heroSrcCode = 'test-src-code';
      _isInternalURL.returns(false);

      addParamsToHeroURL({
        _addQueryParams,
        _isInternalURL,
        heroSrcCode,
        urlString,
      });

      sinon.assert.calledWith(
        _addQueryParams,
        urlString,
        sinon.match({ utm_content: heroSrcCode }),
      );
    });
  });

  describe('makeCallToActionURL', () => {
    it('creates a URL for an addon', () => {
      const slug = 'some-addon-slug';
      const shelfData = createShelfData({ addon: { ...fakeAddon, slug } });

      const root = render({ shelfData });

      expect(root.instance().makeCallToActionURL()).toEqual(
        addParamsToHeroURL({ urlString: getAddonURL(slug) }),
      );
    });

    it('creates a URL for an external entry', () => {
      const homepage = 'https://somehomepage.com';
      const shelfData = createShelfData({
        external: { ...fakePrimaryHeroShelfExternal, homepage },
      });

      const root = render({ shelfData });

      expect(root.instance().makeCallToActionURL()).toEqual(
        addParamsToHeroURL({ urlString: homepage }),
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
