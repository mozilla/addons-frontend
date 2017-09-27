import { oneLine } from 'common-tags';
import deepcopy from 'deepcopy';
import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table';

import LanguageTools, {
  LanguageToolsBase,
} from 'amo/components/LanguageTools';
import Link from 'amo/components/Link';
import { ADDON_TYPE_DICT, ADDON_TYPE_LANG } from 'core/constants';
import { loadLanguageTools } from 'core/reducers/addons';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import {
  createFakeLanguageAddon,
  getFakeI18nInst,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';


describe(__filename, () => {
  const addons = [
    createFakeLanguageAddon({
      name: 'Scottish Language Pack (with Irn-Bru)',
      target_locale: 'en-GB',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageAddon({
      name: 'Old stuffy English',
      target_locale: 'en-GB',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageAddon({
      name: 'English Language Pack with Extra Us',
      target_locale: 'en-GB',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageAddon({
      name: 'Cool new English',
      target_locale: 'en-US',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageAddon({
      name: 'le French Dictionary',
      target_locale: 'fr',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageAddon({
      name: 'French Language Pack',
      target_locale: 'fr',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageAddon({
      name: 'اُردو',
      target_locale: 'ur',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageAddon({
      name: '正體中文 (繁體)',
      target_locale: 'zh-TW',
      type: ADDON_TYPE_LANG,
    }),
  ];

  function renderShallow({
    i18n = getFakeI18nInst(),
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    return shallowUntilTarget(
      <LanguageTools i18n={getFakeI18nInst()} store={store} {...props} />,
      LanguageToolsBase
    );
  }

  it('renders LoadingText if addons are not set', () => {
    const root = renderShallow();

    expect(root.find(LoadingText)).not.toHaveLength(0);
  });

  it('renders LoadingText if addons are empty', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadLanguageTools({ addons: {} }));
    const root = renderShallow({ store });

    expect(root.find(LoadingText)).not.toHaveLength(0);
  });

  it('renders language tools in your locale', () => {
    const { store } = dispatchClientMetadata({ lang: 'fr' });
    store.dispatch(loadLanguageTools({ addons }));
    const root = renderShallow({ store });

    const dictionary = root.find('.LanguageTools-in-your-locale-list-item')
      .at(0);
    const langPack = root.find('.LanguageTools-in-your-locale-list-item')
      .at(1);

    expect(root.find(LoadingText)).toHaveLength(0);
    expect(root.find('.LanguageTools-in-your-locale')).toHaveLength(1);
    expect(dictionary).toHaveLength(1);
    expect(dictionary.find(Link))
      .toHaveProp('children', 'le French Dictionary');
    expect(langPack).toHaveLength(1);
    expect(langPack.find(Link))
      .toHaveProp('children', 'French Language Pack');
  });

  it('omits "language tools in your locale" section if none available', () => {
    const { store } = dispatchClientMetadata({ lang: 'pt-BR' });
    store.dispatch(loadLanguageTools({ addons }));
    const root = renderShallow({ store });

    expect(root.find('.LanguageTools-in-your-locale')).toHaveLength(0);
  });

  it('renders language packs in the table view for the right language', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadLanguageTools({ addons }));
    const root = renderShallow({ store });

    expect(root.find('.LanguageTools-lang-en-GB')).toHaveLength(1);
    expect(root.find('.LanguageTools-lang-en-US')).toHaveLength(1);
    expect(root.find('.LanguageTools-lang-fr')).toHaveLength(1);
    expect(root.find('.LanguageTools-lang-ur')).toHaveLength(1);
    expect(root.find('.LanguageTools-lang-zh-TW')).toHaveLength(1);
  });

  it('does not render languages we know of but do not have addons for', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadLanguageTools({ addons }));
    const root = renderShallow({ store });

    expect(root.find('.LanguageTools-lang-es')).toHaveLength(0);
  });
});
