import * as React from 'react';
import { oneLine } from 'common-tags';

import ContributeCard, {
  CONTRIBUTE_BUTTON_CLICK_ACTION,
  CONTRIBUTE_BUTTON_CLICK_CATEGORY,
  ContributeCardBase,
} from 'amo/components/ContributeCard';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
} from 'amo/constants';
import Button from 'amo/components/Button';
import Card from 'amo/components/Card';
import {
  createFakeEvent,
  createFakeTracking,
  createInternalAddonWithLang,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const createAddon = (params) => {
    return createInternalAddonWithLang({
      ...fakeAddon,
      contributions_url: {
        url: 'https://paypal.me/babar',
        outgoing: 'https://outgoing.mozilla.org/qqq',
      },
      type: ADDON_TYPE_EXTENSION,
      ...params,
    });
  };

  const render = (props = {}) => {
    const allProps = {
      addon: createAddon(),
      i18n: fakeI18n(),
      ...props,
    };

    return shallowUntilTarget(
      <ContributeCard {...allProps} />,
      ContributeCardBase,
    );
  };

  it('renders a Card', () => {
    const root = render();
    expect(root.find(Card)).toHaveLength(1);
  });

  it('does not render anything if no add-on supplied', () => {
    const root = render({ addon: null });
    expect(root.find(Card)).toHaveLength(0);
  });

  it('does not render anything if add-on has no contributions URL', () => {
    const root = render({ addon: createAddon({ contributions_url: null }) });
    expect(root.find(Card)).toHaveLength(0);
  });

  it('renders a Button with a contributions URL', () => {
    const root = render();
    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveProp(
      'href',
      'https://outgoing.mozilla.org/qqq',
    );
    expect(root.find(Button).children().at(1)).toHaveText('Contribute now');
    expect(root.find(Button)).toHaveProp('target', '_blank');
    expect(root.find(Button)).toHaveProp('title', 'https://paypal.me/babar');
  });

  it('displays content for an extension developer', () => {
    const root = render();
    expect(root.find(Card)).toHaveProp('header', 'Support this developer');
    expect(root.find('.ContributeCard-content'))
      .toHaveText(oneLine`The developer of this extension asks that you help
        support its continued development by making a small contribution.`);
  });

  it('displays content for multiple extension developers', () => {
    const root = render({
      addon: createAddon({
        authors: Array(3).fill(fakeAddon.authors[0]),
      }),
    });
    expect(root.find(Card)).toHaveProp('header', 'Support these developers');
    expect(root.find('.ContributeCard-content').text()).toMatch(
      /The developers of this extension ask /,
    );
  });

  it('displays content for a theme artist', () => {
    const root = render({
      addon: createAddon({ type: ADDON_TYPE_STATIC_THEME }),
    });
    expect(root.find(Card)).toHaveProp('header', 'Support this artist');
    expect(root.find('.ContributeCard-content'))
      .toHaveText(oneLine`The artist of this theme asks that you help
        support its continued creation by making a small contribution.`);
  });

  it('displays content for multiple theme artists', () => {
    const root = render({
      addon: createAddon({
        type: ADDON_TYPE_STATIC_THEME,
        authors: Array(3).fill(fakeAddon.authors[0]),
      }),
    });
    expect(root.find(Card)).toHaveProp('header', 'Support these artists');
    expect(root.find('.ContributeCard-content').text()).toMatch(
      /The artists of this theme ask /,
    );
  });

  it('displays content for a add-on author', () => {
    const root = render({ addon: createAddon({ type: ADDON_TYPE_LANG }) });
    expect(root.find(Card)).toHaveProp('header', 'Support this author');
    expect(root.find('.ContributeCard-content'))
      .toHaveText(oneLine`The author of this add-on asks that you help
        support its continued work by making a small contribution.`);
  });

  it('displays content for multiple add-on authors', () => {
    const root = render({
      addon: createAddon({
        type: ADDON_TYPE_LANG,
        authors: Array(3).fill(fakeAddon.authors[0]),
      }),
    });
    expect(root.find(Card)).toHaveProp('header', 'Support these authors');
    expect(root.find('.ContributeCard-content').text()).toMatch(
      /The authors of this add-on ask /,
    );
  });

  it('sends a tracking event when the button is clicked', () => {
    const _tracking = createFakeTracking();
    const contributionsUrl = { url: 'some/url', outgoing: 'some/other/url' };
    const guid = 'some-guid';
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      contributions_url: contributionsUrl,
      guid,
    });

    const root = render({ _tracking, addon });

    const event = createFakeEvent();

    root.find('.ContributeCard-button').simulate('click', event);

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: CONTRIBUTE_BUTTON_CLICK_ACTION,
      category: CONTRIBUTE_BUTTON_CLICK_CATEGORY,
      label: guid,
    });
    sinon.assert.calledOnce(_tracking.sendEvent);
  });
});
