import * as React from 'react';

import AddonBadges, { AddonBadgesBase } from 'amo/components/AddonBadges';
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_FIREFOX,
  RECOMMENDED,
} from 'amo/constants';
import {
  createInternalAddonWithLang,
  createFakeAddon,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Badge from 'amo/components/Badge';
import PromotedBadge from 'amo/components/PromotedBadge';

describe(__filename, () => {
  function shallowRender(props) {
    const allProps = {
      i18n: fakeI18n(),
      store: dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX }).store,
      ...props,
    };

    return shallowUntilTarget(<AddonBadges {...allProps} />, AddonBadgesBase);
  }

  it('returns null when there is no add-on', () => {
    const root = shallowRender({ addon: null });
    expect(root.html()).toEqual(null);
  });

  it('displays no badges when none are called for', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_EXTENSION,
    });
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveLength(0);
  });

  it('displays a promoted badge for a promoted add-on', () => {
    const category = RECOMMENDED;
    const _getPromotedCategory = sinon.stub().returns(category);

    const root = shallowRender({
      _getPromotedCategory,
      addon: createInternalAddonWithLang(fakeAddon),
    });

    expect(root.find(PromotedBadge)).toHaveLength(1);
    expect(root.find(PromotedBadge)).toHaveProp('category', category);
  });

  it('does not display a promoted badge for a non-promoted addon', () => {
    const _getPromotedCategory = sinon.stub().returns(null);

    const root = shallowRender({
      _getPromotedCategory,
      addon: createInternalAddonWithLang(fakeAddon),
    });

    expect(root.find(PromotedBadge)).toHaveLength(0);
  });

  it('displays a badge when the addon is experimental', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        is_experimental: true,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'experimental');
    expect(root.find(Badge)).toHaveProp('label', 'Experimental');
  });

  it('does not display a badge when the addon is not experimental', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        is_experimental: false,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge).find({ type: 'experimental' })).toHaveLength(0);
  });

  it('displays a badge when the addon requires payment', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        requires_payment: true,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'requires-payment');
    expect(root.find(Badge)).toHaveProp(
      'label',
      'Some features may require payment',
    );
  });

  it('does not display a badge when the addon does not require payment', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        requires_payment: false,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge).find({ type: 'requires-payment' })).toHaveLength(0);
  });
});
