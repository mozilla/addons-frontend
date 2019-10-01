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

    it('strips the host name for a full URL containing the current host', () => {
      const baseURL = 'https://example.org';
      const urlString = url.format({ ...url.parse(baseURL), pathname });

      expect(
        checkInternalURL({ _config: getFakeConfig({ baseURL }), urlString })
          .relativeURL,
      ).toEqual(pathname);
    });

    it('strips the host name for a protocol-free URL containing the current host', () => {
      const currentHost = 'example.org';
      const baseURL = `https://${currentHost}`;

      expect(
        checkInternalURL({
          _config: getFakeConfig({ baseURL }),
          urlString: `//${currentHost}${pathname}`,
        }).relativeURL,
      ).toEqual(pathname);
    });

    it('ensures that the generated URL always starst with a /', () => {
      const baseURL = 'https://example.org/';
      const urlString = url.format({ ...url.parse(baseURL), pathname });

      expect(
        checkInternalURL({ _config: getFakeConfig({ baseURL }), urlString })
          .relativeURL,
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
        }).relativeURL,
      ).toEqual(urlString);
    });

    describe('isInternal prop', () => {
      it('returns true for a single slash-prefixed URL', () => {
        expect(
          checkInternalURL({ urlString: '/some/path' }).isInternal,
        ).toEqual(true);
      });

      it('returns true for a protocol-free URL containing the current host', () => {
        const currentHost = 'example.org';
        const baseURL = `https://${currentHost}`;

        expect(
          checkInternalURL({
            _config: getFakeConfig({ baseURL }),
            urlString: `//${currentHost}`,
          }).isInternal,
        ).toEqual(true);
      });

      it('returns false for a protocol-free URL containing a different host', () => {
        const baseURL = 'https://example.org';

        expect(
          checkInternalURL({
            _config: getFakeConfig({ baseURL }),
            urlString: '//www.mozilla.org',
          }).isInternal,
        ).toEqual(false);
      });

      it('returns true for a full URL containing the current host', () => {
        const baseURL = 'https://example.org';
        const urlString = url.format({ ...url.parse(baseURL), pathname });

        expect(
          checkInternalURL({ _config: getFakeConfig({ baseURL }), urlString })
            .isInternal,
        ).toEqual(true);
      });

      it('returns false for a full URL containing a different host', () => {
        const siteBaseURL = 'https://example.org';
        const otherBaseURL = 'https://www.mozilla.org';

        const urlString = url.format({ ...url.parse(otherBaseURL), pathname });

        expect(
          checkInternalURL({
            _config: getFakeConfig({ baseURL: siteBaseURL }),
            urlString,
          }).isInternal,
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
          }).isInternal,
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
          }).isInternal,
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
      _checkInternalURL.returns({ isInternal: true });

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
      _checkInternalURL.returns({ isInternal: true });

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
      _checkInternalURL.returns({ isInternal: false });

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
      _checkInternalURL.returns({ isInternal: false });

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
