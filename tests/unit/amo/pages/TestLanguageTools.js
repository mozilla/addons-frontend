import { shallow } from 'enzyme';
import * as React from 'react';

import LanguageTools, {
  LanguageToolsBase,
  LanguageToolList,
} from 'amo/pages/LanguageTools';
import Link from 'amo/components/Link';
import { ADDON_TYPE_DICT, ADDON_TYPE_LANG } from 'core/constants';
import {
  getAllLanguageTools,
  loadLanguageTools,
} from 'core/reducers/languageTools';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFakeLanguageTool,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';

describe(__filename, () => {
  const languageTools = [
    createFakeLanguageTool({
      id: 1,
      name: 'Scottish Language Pack (with Irn-Bru)',
      target_locale: 'en-GB',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 2,
      name: 'Old stuffy English',
      target_locale: 'en-GB',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 3,
      name: 'English Language Pack with Extra Us',
      target_locale: 'en-GB',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 4,
      name: 'Cool new English',
      target_locale: 'en-US',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 5,
      name: 'le French Dictionary',
      target_locale: 'fr',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 6,
      name: 'French Language Pack',
      target_locale: 'fr',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 7,
      name: 'اُردو',
      target_locale: 'ur',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 8,
      name: '正體中文 (繁體)',
      target_locale: 'zh-TW',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 9,
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
      LanguageToolsBase,
    );
  }

  it('renders LoadingText if language tools are not set', () => {
    const root = renderShallow();

    expect(root.find(LoadingText)).not.toHaveLength(0);
  });

  it('renders LoadingText if language tools are empty', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadLanguageTools({ languageTools: [] }));

    const root = renderShallow({ store });

    expect(root.find(LoadingText)).not.toHaveLength(0);
  });

  it('renders language tools in your locale', () => {
    const { store } = dispatchClientMetadata({ lang: 'fr' });
    store.dispatch(loadLanguageTools({ languageTools }));

    const root = renderShallow({ store });

    const dictionary = root.find(
      `.LanguageTools-in-your-locale-list-item--${ADDON_TYPE_DICT}`,
    );
    const langPack = root.find(
      `.LanguageTools-in-your-locale-list-item--${ADDON_TYPE_LANG}`,
    );

    expect(root.find(LoadingText)).toHaveLength(0);
    expect(root.find('.LanguageTools-in-your-locale')).toHaveLength(1);
    expect(dictionary).toHaveLength(1);
    expect(dictionary.find(Link)).toHaveProp(
      'children',
      'le French Dictionary',
    );
    expect(langPack).toHaveLength(1);
    expect(langPack.find(Link)).toHaveProp('children', 'French Language Pack');
  });

  it('omits "language tools in your locale" section if none available', () => {
    const { store } = dispatchClientMetadata({ lang: 'pt-BR' });
    store.dispatch(loadLanguageTools({ languageTools }));

    const root = renderShallow({ store });

    expect(root.find('.LanguageTools-in-your-locale')).toHaveLength(0);
  });

  it('renders language packs in the table view for the right language', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadLanguageTools({ languageTools }));

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

  it('renders multiple language tools in a list using LanguageToolList', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadLanguageTools({ languageTools }));

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

  it('does not render languages we know of but do not have languages for', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(loadLanguageTools({ languageTools }));

    const root = renderShallow({ store });

    expect(root.find('.LanguageTools-lang-es')).toHaveLength(0);
  });

  describe('LanguageToolList', () => {
    it('renders a LanguageToolList', () => {
      const { store } = dispatchClientMetadata({ lang: 'en-GB' });
      store.dispatch(loadLanguageTools({ languageTools }));

      const allLanguageTools = getAllLanguageTools(store.getState());

      const languageToolsInYourLocale = allLanguageTools.filter(
        (languageTool) => {
          return languageTool.target_locale === store.getState().api.lang;
        },
      );
      const dictionaries = languageToolsInYourLocale.filter((languageTool) => {
        return languageTool.type === ADDON_TYPE_DICT;
      });
      const languagePacks = languageToolsInYourLocale.filter((languageTool) => {
        return languageTool.type === ADDON_TYPE_LANG;
      });

      const dictionaryList = shallow(
        <LanguageToolList languageTools={dictionaries} />,
      );
      const languagePackList = shallow(
        <LanguageToolList languageTools={languagePacks} />,
      );

      expect(dictionaryList.find('.LanguageTools-addon-list')).toHaveLength(1);
      expect(languagePackList.find('.LanguageTools-addon-list')).toHaveLength(
        1,
      );
      expect(dictionaryList.find('li')).toHaveLength(1);
      expect(languagePackList.find('li')).toHaveLength(2);
    });
  });

  it('renders nothing if addons are null', () => {
    const root = shallow(<LanguageToolList languageTools={null} />);

    expect(root.find('.LanguageTools-addon-list')).toHaveLength(0);
    expect(root.find('title')).toHaveLength(0);
  });

  it('renders an HTML title', () => {
    const { store } = dispatchClientMetadata({ lang: 'pt-BR' });
    store.dispatch(loadLanguageTools({ languageTools }));

    const root = renderShallow({ store });

    expect(root.find('title')).toHaveText('Dictionaries and Language Packs');
  });

  it('renders add-ons for all variants of a short locale on a single row (only one supported language)', () => {
    // The short locale is `az` here.
    const addons = [
      createFakeLanguageTool({
        id: 1,
        name: 'Azərbaycanca (AZ) Language Pack',
        target_locale: 'az',
        type: ADDON_TYPE_LANG,
      }),
      createFakeLanguageTool({
        id: 2,
        name: 'Azerbaijani Spell Checker',
        target_locale: 'az-IR',
        type: ADDON_TYPE_DICT,
      }),
    ];

    const { store } = dispatchClientMetadata();
    store.dispatch(loadLanguageTools({ languageTools: addons }));

    const root = renderShallow({ store });

    // We expect only one row with all the add-ons in it.
    expect(root.find('.LanguageTools-table-row')).toHaveLength(1);

    expect(root.find(LanguageToolList)).toHaveLength(2);
    expect(root.find(LanguageToolList).at(0)).toHaveProp('languageTools', [
      addons[0],
    ]);
    expect(root.find(LanguageToolList).at(1)).toHaveProp('languageTools', [
      addons[1],
    ]);
  });

  it('renders add-ons on two different rows corresponding to two supported languages', () => {
    // The short locale is `fa` here, which is in the list of supported
    // languages (`src/core/languages.js`) together with `fa-IR`.
    const addons = [
      createFakeLanguageTool({
        id: 1,
        name: 'Persian Dictionary',
        target_locale: 'fa',
        type: ADDON_TYPE_DICT,
      }),
      createFakeLanguageTool({
        id: 2,
        name: 'Persian (IR) Dictionary',
        target_locale: 'fa-IR',
        type: ADDON_TYPE_DICT,
      }),
      createFakeLanguageTool({
        id: 3,
        name: 'Lilak, Persian Spell Checker Dictionary',
        target_locale: 'fa-IR',
        type: ADDON_TYPE_DICT,
      }),
    ];

    const { store } = dispatchClientMetadata();
    store.dispatch(loadLanguageTools({ languageTools: addons }));

    const root = renderShallow({ store });

    expect(root.find('.LanguageTools-table-row')).toHaveLength(2);

    expect(root.find(LanguageToolList).at(0)).toHaveProp('languageTools', [
      addons[0],
    ]);
    expect(root.find(LanguageToolList).at(1)).toHaveProp('languageTools', [
      addons[1],
      addons[2],
    ]);
  });

  it('renders a canonical link tag', () => {
    const baseURL = 'https://example.org';
    const _config = getFakeConfig({ baseURL });
    const pathname = '/language-tools/';

    const { store } = dispatchClientMetadata({ pathname });

    const root = renderShallow({ _config, store });

    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
    expect(root.find('link[rel="canonical"]')).toHaveProp(
      'href',
      `${baseURL}${pathname}`,
    );
  });
});
