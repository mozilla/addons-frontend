import * as React from 'react';

import Button from 'amo/components/Button';
import GetFirefoxBanner, {
  GET_FIREFOX_BANNER_CLICK_ACTION,
  GET_FIREFOX_BANNER_CLICK_CATEGORY,
  GET_FIREFOX_BANNER_DISMISS_ACTION,
  GET_FIREFOX_BANNER_DISMISS_CATEGORY,
  GET_FIREFOX_BANNER_UTM_CONTENT,
  GetFirefoxBannerBase,
} from 'amo/components/GetFirefoxBanner';
import { VARIANT_NEW } from 'amo/experiments/20210404_download_cta_experiment';
import Notice from 'amo/components/Notice';
import {
  DOWNLOAD_FIREFOX_BASE_URL,
  DOWNLOAD_FIREFOX_UTM_CAMPAIGN,
} from 'amo/constants';
import { makeQueryStringWithUTM } from 'amo/utils';
import {
  createFakeEvent,
  createFakeTracking,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
  userAgents,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render(props = {}) {
    const { store } = dispatchClientMetadata();

    return shallowUntilTarget(
      <GetFirefoxBanner i18n={fakeI18n()} store={store} {...props} />,
      GetFirefoxBannerBase,
    );
  }

  describe('On firefox', () => {
    it('renders nothing if the browser is Firefox Desktop', () => {
      const { store } = dispatchClientMetadata({
        userAgent: userAgents.firefox[0],
      });
      const root = render({ store });

      expect(root.find('.GetFirefoxBanner')).toHaveLength(0);
    });

    it('renders nothing if the browser is Firefox for Android', () => {
      const { store } = dispatchClientMetadata({
        userAgent: userAgents.firefoxAndroid[0],
      });
      const root = render({ store });

      expect(root.find('.GetFirefoxBanner')).toHaveLength(0);
    });

    it('renders nothing if the browser is Firefox for iOS', () => {
      const { store } = dispatchClientMetadata({
        userAgent: userAgents.firefoxIOS[0],
      });
      const root = render({ store });

      expect(root.find('.GetFirefoxBanner')).toHaveLength(0);
    });
  });

  describe('Not firefox', () => {
    const { store } = dispatchClientMetadata({
      userAgent: userAgents.chrome[0],
    });

    it('renders a GetFirefoxBanner if the browser is not Firefox', () => {
      const root = render({ store });

      expect(root.find('.GetFirefoxBanner')).toHaveLength(1);
    });

    it('renders a dismissable warning Notice', () => {
      const root = render({ store });

      const notice = root.find(Notice);
      expect(notice).toHaveLength(1);
      expect(notice).toHaveProp('dismissible', true);
      expect(notice).toHaveProp('type', 'warning');
    });

    it('has the expected text', () => {
      const root = render({ store });

      expect(root.find('.GetFirefoxBanner-content')).toHaveText(
        `To use these add-ons, you'll need to <Button />`,
      );
      expect(root.find(Button).children()).toHaveText('download Firefox');
    });

    it('sets the href on the button with the expected utm params', () => {
      const root = render({ store });

      const expectedHref = `${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM(
        {
          utm_content: GET_FIREFOX_BANNER_UTM_CONTENT,
          utm_campaign: `${DOWNLOAD_FIREFOX_UTM_CAMPAIGN}-${VARIANT_NEW}`,
        },
      )}`;
      expect(root.find(Button)).toHaveProp('href', expectedHref);
    });

    it('sends a tracking event when the button is clicked', () => {
      const _tracking = createFakeTracking();
      const root = render({ _tracking, store });

      const event = createFakeEvent();
      root.find(Button).simulate('click', event);

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: GET_FIREFOX_BANNER_CLICK_ACTION,
        category: GET_FIREFOX_BANNER_CLICK_CATEGORY,
      });
      sinon.assert.calledOnce(_tracking.sendEvent);
    });

    it('sends a tracking event when the banner is dismissed', () => {
      const _tracking = createFakeTracking();
      const root = render({ _tracking, store });

      const notice = root.find(Notice);
      expect(notice).toHaveProp('onDismiss');
      const onDismiss = notice.prop('onDismiss');
      onDismiss();

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: GET_FIREFOX_BANNER_DISMISS_ACTION,
        category: GET_FIREFOX_BANNER_DISMISS_CATEGORY,
      });
      sinon.assert.calledOnce(_tracking.sendEvent);
    });
  });
});
