import { shallow } from 'enzyme';
import React from 'react';

import LanguageTools, {
  LanguageToolsBase,
  LanguageToolList,
  mapStateToProps,
} from 'amo/components/LanguageTools';
import Link from 'amo/components/Link';
import { ADDON_TYPE_DICT, ADDON_TYPE_LANG } from 'core/constants';
import { loadAddonResults } from 'core/reducers/addons';
import {
  createFakeAddon,
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import {
  createFakeLanguageAddon,
  fakeI18n,
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
    createFakeLanguageAddon({
      name: 'isiZulu',
      target_locale: 'zu',
      type: ADDON_TYPE_LANG,
    }),
  ];

  function renderShallow({
    i18n = fakeI18n(),
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    return shallowUntilTarget(
      <LanguageTools i18n={i18n} store={store} {...props} />,
      LanguageToolsBase
    );
  }

  it('renders LoadingText if addons are not set', () => {
    const root = renderShallow();

    expect(root.find(LoadingText)).not.toHaveLength(0);
  });

  it('renders LoadingText if addons are empty', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadAddonResults({ addons: {} }));
    const root = renderShallow({ store });

    expect(root.find(LoadingText)).not.toHaveLength(0);
  });

  it('renders LoadingText if there are addons but no language addons', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadAddonResults({
      addons: {
        [fakeAddon.slug]: createFakeAddon(fakeAddon),
      },
    }));
    const root = renderShallow({ store });

    expect(root.find(LoadingText)).not.toHaveLength(0);
  });

  it('renders language tools in your locale', () => {
    const { store } = dispatchClientMetadata({ lang: 'fr' });
    store.dispatch(loadAddonResults({ addons }));
    const root = renderShallow({ store });

    const dictionary = root.find(
      `.LanguageTools-in-your-locale-list-item--${ADDON_TYPE_DICT}`
    );
    const langPack = root.find(
      `.LanguageTools-in-your-locale-list-item--${ADDON_TYPE_LANG}`
    );

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
    store.dispatch(loadAddonResults({ addons }));
    const root = renderShallow({ store });

    expect(root.find('.LanguageTools-in-your-locale')).toHaveLength(0);
  });

  it('renders language packs in the table view for the right language', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadAddonResults({ addons }));
    const root = renderShallow({ store });

    expect(root.find('.LanguageTools-lang-en-GB')).toHaveLength(1);
    expect(root.find('.LanguageTools-lang-en-US')).toHaveLength(1);
    expect(root.find('.LanguageTools-lang-fr')).toHaveLength(1);
    expect(root.find('.LanguageTools-lang-ur')).toHaveLength(1);
    expect(root.find('.LanguageTools-lang-zh-TW')).toHaveLength(1);

    // Zulu is not a supported locale on the site but since Firefox UI locales
    // are not necessarily going to match the site locales we should
    // still render the zulu language pack and dictionary.
    expect(root.find('.LanguageTools-lang-zu')).toHaveLength(1);
  });

  it('renders multiple addons in a list using LanguageToolList', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadAddonResults({ addons }));
    const root = renderShallow({ store });

    const dictionaryList = root
      .find('.LanguageTools-lang-en-GB-dictionaries')
      .find(LanguageToolList);
    const languagePackList = root
      .find('.LanguageTools-lang-en-GB-languagePacks')
      .find(LanguageToolList);
    expect(dictionaryList).toHaveLength(1);
    expect(languagePackList).toHaveLength(1);
  });

  it('does not render languages we know of but do not have addons for', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadAddonResults({ addons }));
    const root = renderShallow({ store });

    expect(root.find('.LanguageTools-lang-es')).toHaveLength(0);
  });

  describe('LanguageToolList', () => {
    it('renders a LanguageToolList', () => {
      const { store } = dispatchClientMetadata({ lang: 'en-GB' });
      store.dispatch(loadAddonResults({ addons }));
      const languageTools = mapStateToProps(store.getState()).addons;

      const languageToolsInYourLocale = languageTools.filter((addon) => {
        return addon.target_locale === store.getState().api.lang;
      });
      const dictionaries = languageToolsInYourLocale.filter((addon) => {
        return addon.type === ADDON_TYPE_DICT;
      });
      const languagePacks = languageToolsInYourLocale.filter((addon) => {
        return addon.type === ADDON_TYPE_LANG;
      });

      const dictionaryList = shallow(
        <LanguageToolList addons={dictionaries} />
      );
      const languagePackList = shallow(
        <LanguageToolList addons={languagePacks} />
      );

      expect(dictionaryList.find('.LanguageTools-addon-list'))
        .toHaveLength(1);
      expect(languagePackList.find('.LanguageTools-addon-list'))
        .toHaveLength(1);
      expect(dictionaryList.find('li')).toHaveLength(1);
      expect(languagePackList.find('li')).toHaveLength(2);
    });
  });

  it('renders nothing if addons are null', () => {
    const root = shallow(<LanguageToolList addons={null} />);

    expect(root.find('.LanguageTools-addon-list')).toHaveLength(0);
    expect(root.find('title')).toHaveLength(0);
  });

  it('renders an HTML title', () => {
    const { store } = dispatchClientMetadata({ lang: 'pt-BR' });
    store.dispatch(loadAddonResults({ addons }));
    const root = renderShallow({ store });

    expect(root.find('title')).toHaveText('Dictionaries and Language Packs');
  });
});
