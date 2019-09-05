import url from 'url';

import * as React from 'react';

import AddonTitle from 'amo/components/AddonTitle';
import HeroRecommendation, {
  PRIMARY_HERO_SRC,
  addParamsToHeroURL,
  HeroRecommendationBase,
} from 'amo/components/HeroRecommendation';
import { createInternalAddon } from 'core/reducers/addons';
import { createInternalHeroShelves } from 'amo/reducers/home';
import {
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
      shelfData: createShelfData(),
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
        addParamsToHeroURL({ urlString: `/addon/${slug}/` }),
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
        addParamsToHeroURL({ urlString: homepage }),
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

  it('returns nothing if the API returns neither an addon nor an external entry', () => {
    // Note that this should not be possible from the API, as well as based on
    // the Flow definitions, but all consumers of this component are not
    // covered by Flow.
    const root = render({
      shelfData: createShelfData({
        addon: undefined,
        external: undefined,
      }),
    });

    expect(root.find('.HeroRecommendation')).toHaveLength(0);
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
});
