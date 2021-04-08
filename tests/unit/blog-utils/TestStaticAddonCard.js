import * as React from 'react';
import { shallow } from 'enzyme';

import AddonTitle from 'amo/components/AddonTitle';
import AddonBadges from 'amo/components/AddonBadges';
import StaticAddonCard from 'blog-utils/StaticAddonCard';
import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
} from 'amo/components/GetFirefoxButton';
import {
  fakeAddon,
  createLocalizedString,
  createInternalAddonWithLang,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ addon }) => {
    return shallow(<StaticAddonCard addon={addon} />);
  };

  it('renders nothing when add-on is falsey', () => {
    const root = render({ addon: null });

    expect(root.find('.StaticAddonCard')).toHaveLength(0);
  });

  it('renders a static add-on card', () => {
    const addon = createInternalAddonWithLang(fakeAddon);

    const root = render({ addon });

    expect(root.find('.StaticAddonCard')).toHaveLength(1);
    expect(root).toHaveProp('data-addon-id', addon.id);

    expect(root.find(AddonTitle)).toHaveLength(1);
    expect(root.find(AddonTitle)).toHaveProp('addon', addon);

    expect(root.find(AddonBadges)).toHaveLength(1);
    expect(root.find(AddonBadges)).toHaveProp('addon', addon);

    expect(root.find('.AddonSummary').html()).toContain(addon.summary);

    expect(root.find(GetFirefoxButton)).toHaveLength(1);
    expect(root.find(GetFirefoxButton)).toHaveProp('addon', addon);
    expect(root.find(GetFirefoxButton)).toHaveProp(
      'buttonType',
      GET_FIREFOX_BUTTON_TYPE_ADDON,
    );
  });

  it('displays the description if there is no summary', () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon, summary: null });

    const root = render({ addon });

    expect(root.find('.AddonSummary').html()).not.toContain(addon.summary);
    expect(root.find('.AddonSummary').html()).toContain(addon.description);
  });

  it('sanitizes the summary', () => {
    const scriptHTML = createLocalizedString(
      '<script>alert(document.cookie);</script>',
    );

    const root = render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        summary: scriptHTML,
      }),
    });

    // Make sure an actual script tag was not created.
    expect(root.find('.AddonSummary script')).toHaveLength(0);
    // Make sure the script has been removed.
    expect(root.find('.AddonSummary').html()).not.toContain('<script>');
  });
});
