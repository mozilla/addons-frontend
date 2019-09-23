import url from 'url';

import {
  addParamsToHeroURL,
  getCanonicalURL,
  getAddonURL,
  checkInternalURL,
} from 'amo/utils';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getCanonicalURL', () => {
    it(`returns an absolute canonical URL`, () => {
      const locationPathname = '/path/name';
      const baseURL = 'https://example.org';
      const _config = getFakeConfig({ baseURL });

      expect(getCanonicalURL({ _config, locationPathname })).toEqual(
        `${baseURL}${locationPathname}`,
      );
    });
  });

  describe('getAddonURL', () => {
    it(`returns an addon URL using slug`, () => {
      const slug = 'some-addon-slug';

      expect(getAddonURL(slug)).toEqual(`/addon/${slug}/`);
    });
  });

  describe('checkInternalURL', () => {
    const pathname = '/path/name';

    it('strips the host name for the current host', () => {
      const baseURL = 'https://example.org';
      const urlString = url.format({ ...url.parse(baseURL), pathname });

      expect(
        checkInternalURL({ _config: getFakeConfig({ baseURL }), urlString })
          .strippedURL,
      ).toEqual(pathname);
    });

    it('does not strip the host name for a different host', () => {
      const siteBaseURL = 'https://example.org';
      const otherBaseURL = 'https://www.mozilla.org';

      const urlString = url.format({ ...url.parse(otherBaseURL), pathname });

      expect(
        checkInternalURL({
          _config: getFakeConfig({ baseURL: siteBaseURL }),
          urlString,
        }).strippedURL,
      ).toEqual(urlString);
    });

    describe('isInternalURL prop', () => {
      it('returns true for a slash-prefixed URL', () => {
        expect(checkInternalURL({ urlString: pathname }).isInternalURL).toEqual(
          true,
        );
      });

      it('returns true for a full URL for the current host', () => {
        const baseURL = 'https://example.org';
        const urlString = url.format({ ...url.parse(baseURL), pathname });

        expect(
          checkInternalURL({ _config: getFakeConfig({ baseURL }), urlString })
            .isInternalURL,
        ).toEqual(true);
      });

      it('returns false for a full URL for a different host', () => {
        const siteBaseURL = 'https://example.org';
        const otherBaseURL = 'https://www.mozilla.org';

        const urlString = url.format({ ...url.parse(otherBaseURL), pathname });

        expect(
          checkInternalURL({
            _config: getFakeConfig({ baseURL: siteBaseURL }),
            urlString,
          }).isInternalURL,
        ).toEqual(false);
      });

      it('returns false for an subdomain of the current host', () => {
        const siteBaseURL = 'https://example.org';
        const subdomainBaseURL = 'https://subdomain.example.org';

        const urlString = url.format({
          ...url.parse(subdomainBaseURL),
          pathname,
        });

        expect(
          checkInternalURL({
            _config: getFakeConfig({ baseURL: siteBaseURL }),
            urlString,
          }).isInternalURL,
        ).toEqual(false);
      });

      it('returns false if the current host is a subdomain of the proposed URLs host', () => {
        const siteBaseURL = 'https://subdomain.example.org';
        const proposedBaseURL = 'https://example.org';

        const urlString = url.format({
          ...url.parse(proposedBaseURL),
          pathname,
        });

        expect(
          checkInternalURL({
            _config: getFakeConfig({ baseURL: siteBaseURL }),
            urlString,
          }).isInternalURL,
        ).toEqual(false);
      });
    });
  });

  describe('addParamsToHeroURL', () => {
    let _addQueryParams;
    let _checkInternalURL;
    const externalQueryParams = { externalParam1: 'externalParam1' };
    const heroSrcCode = 'homepage-primary-hero';
    const internalQueryParams = { internalParam1: 'internalParam1' };
    const urlString = '/path/name';

    beforeEach(() => {
      _addQueryParams = sinon.spy();
      _checkInternalURL = sinon.stub();
    });

    it('passes internal query params to _addQueryParams for an internal URL', () => {
      _checkInternalURL.returns({ isInternalURL: true });

      addParamsToHeroURL({
        _addQueryParams,
        _checkInternalURL,
        externalQueryParams,
        heroSrcCode,
        internalQueryParams,
        urlString,
      });

      sinon.assert.calledWith(_addQueryParams, urlString, internalQueryParams);
    });

    it('passes default internal query params to _addQueryParams for an internal URL', () => {
      _checkInternalURL.returns({ isInternalURL: true });

      addParamsToHeroURL({
        _addQueryParams,
        _checkInternalURL,
        heroSrcCode,
        urlString,
      });

      sinon.assert.calledWith(_addQueryParams, urlString, {
        src: heroSrcCode,
      });
    });

    it('passes external query params to _addQueryParams for an external URL', () => {
      _checkInternalURL.returns({ isInternalURL: false });

      addParamsToHeroURL({
        _addQueryParams,
        _checkInternalURL,
        externalQueryParams,
        heroSrcCode,
        internalQueryParams,
        urlString,
      });

      sinon.assert.calledWith(_addQueryParams, urlString, externalQueryParams);
    });

    it('passes default external query params to _addQueryParams for an external URL', () => {
      const baseURL = 'https://example.org';
      const _config = getFakeConfig({ baseURL });
      _checkInternalURL.returns({ isInternalURL: false });

      addParamsToHeroURL({
        _addQueryParams,
        _config,
        _checkInternalURL,
        heroSrcCode,
        urlString,
      });

      sinon.assert.calledWith(_addQueryParams, urlString, {
        utm_content: heroSrcCode,
        utm_medium: 'referral',
        utm_source: url.parse(baseURL).host,
      });
    });
  });
});
