import { waitFor } from '@testing-library/react';

import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_LANG,
  CLIENT_APP_FIREFOX,
} from 'amo/constants';
import { loadLanguageTools } from 'amo/reducers/languageTools';
import { getCanonicalURL } from 'amo/utils';
import {
  createFakeLanguageTool,
  dispatchClientMetadata,
  getElement,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  let lang;
  const defaultTestLang = 'fr';
  const clientApp = CLIENT_APP_FIREFOX;
  const languageTools = [
    createFakeLanguageTool({
      id: 1,
      lang: defaultTestLang,
      name: 'Scottish Language Pack (with Irn-Bru)',
      target_locale: 'en-GB',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 2,
      lang: defaultTestLang,
      name: 'Old stuffy English',
      target_locale: 'en-GB',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 3,
      lang: defaultTestLang,
      name: 'English Language Pack with Extra Us',
      target_locale: 'en-GB',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 4,
      lang: defaultTestLang,
      name: 'Cool new English',
      target_locale: 'en-US',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 5,
      lang: defaultTestLang,
      name: 'le French Dictionary',
      target_locale: 'fr',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 6,
      lang: defaultTestLang,
      name: 'French Language Pack',
      target_locale: 'fr',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 7,
      lang: defaultTestLang,
      name: 'اُردو',
      target_locale: 'ur',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 8,
      lang: defaultTestLang,
      name: '正體中文 (繁體)',
      target_locale: 'zh-TW',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 9,
      lang: defaultTestLang,
      name: 'isiZulu',
      target_locale: 'zu',
      type: ADDON_TYPE_LANG,
    }),
  ];

  beforeEach(() => {
    lang = defaultTestLang;
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  function render() {
    return defaultRender({
      initialEntries: [`/${lang}/${clientApp}/language-tools/`],
      store,
    });
  }

  it('renders LoadingText if language tools are not set', () => {
    render();

    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('renders LoadingText if language tools are empty', () => {
    store.dispatch(loadLanguageTools({ languageTools: [] }));

    render();

    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('renders language tools in your locale', () => {
    store.dispatch(loadLanguageTools({ languageTools }));

    render();

    expect(
      screen.getByRole('heading', { name: 'Available for your locale' }),
    ).toBeInTheDocument();

    const dictionary = screen.getByClassName(
      `LanguageTools-in-your-locale-list-item--${ADDON_TYPE_DICT}`,
    );
    expect(
      within(dictionary).getByText('le French Dictionary'),
    ).toBeInTheDocument();

    const langPack = screen.getByClassName(
      `LanguageTools-in-your-locale-list-item--${ADDON_TYPE_LANG}`,
    );
    expect(
      within(langPack).getByText('French Language Pack'),
    ).toBeInTheDocument();
  });

  it('omits "language tools in your locale" section if none available', () => {
    lang = 'pt-BR';
    store = dispatchClientMetadata({ clientApp, lang }).store;
    store.dispatch(loadLanguageTools({ languageTools }));

    render();

    expect(
      screen.queryByRole('heading', { name: 'Available for your locale' }),
    ).not.toBeInTheDocument();
  });

  it('renders language packs in the table view for the right language', () => {
    store.dispatch(loadLanguageTools({ languageTools }));

    render();

    expect(
      screen.getByText('Scottish Language Pack (with Irn-Bru)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('English Language Pack with Extra Us'),
    ).toBeInTheDocument();
    expect(screen.getByText('Old stuffy English')).toBeInTheDocument();
    expect(screen.getByText('Cool new English')).toBeInTheDocument();
    // Zulu is not a supported locale on the site but since Firefox UI locales
    // are not necessarily going to match the site locales we should
    // still render the zulu language pack and dictionary.
    expect(screen.getAllByText('isiZulu')).toHaveLength(2);
  });

  it('renders multiple language tools in a list', () => {
    store.dispatch(loadLanguageTools({ languageTools }));

    render();

    const dictionaryList = within(
      screen.getByClassName('LanguageTools-lang-en-GB-dictionaries'),
    ).getAllByRole('listitem');
    const languagePackList = within(
      screen.getByClassName('LanguageTools-lang-en-GB-languagePacks'),
    ).getAllByRole('listitem');

    expect(dictionaryList).toHaveLength(1);
    expect(languagePackList).toHaveLength(2);
  });

  it('does not render languages we know of but do not have languages for', () => {
    store.dispatch(loadLanguageTools({ languageTools }));

    render();

    expect(
      screen.queryByClassName('LanguageTools-lang-es'),
    ).not.toBeInTheDocument();
  });

  it('renders an HTML title', async () => {
    lang = 'pt-BR';
    store = dispatchClientMetadata({ clientApp, lang }).store;
    store.dispatch(loadLanguageTools({ languageTools }));

    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        'Dictionaries and Language Packs – Add-ons for Firefox (pt-BR)',
      ),
    );
  });

  it('renders add-ons for all variants of a short locale on a single row (only one supported language)', () => {
    // The short locale is `az` here.
    const addons = [
      createFakeLanguageTool({
        id: 1,
        lang,
        name: 'Azərbaycanca (AZ) Language Pack',
        target_locale: 'az',
        type: ADDON_TYPE_LANG,
      }),
      createFakeLanguageTool({
        id: 2,
        lang,
        name: 'Azerbaijani Spell Checker',
        target_locale: 'az-IR',
        type: ADDON_TYPE_DICT,
      }),
      createFakeLanguageTool({
        id: 3,
        lang,
        name: 'Azerbaijani Foo',
        target_locale: 'az-IR-foo',
        type: ADDON_TYPE_DICT,
      }),
    ];

    store.dispatch(loadLanguageTools({ languageTools: addons }));

    render();

    // We expect only one row with all the add-ons in it.
    const row = screen.getByClassName('LanguageTools-table-row');
    expect(row).toBeInTheDocument();
    const langPacks = within(row).getByClassName(
      'LanguageTools-lang-az-languagePacks',
    );
    expect(
      within(langPacks).getByText('Azərbaycanca (AZ) Language Pack'),
    ).toBeInTheDocument();
    const dictionaries = within(row).getByClassName(
      'LanguageTools-lang-az-dictionaries',
    );
    expect(
      within(dictionaries).getByText('Azerbaijani Spell Checker'),
    ).toBeInTheDocument();
    expect(
      within(dictionaries).getByText('Azerbaijani Foo'),
    ).toBeInTheDocument();
  });

  // See: https://github.com/mozilla/addons-frontend/issues/7702
  it('only renders supported languages', () => {
    const addons = [
      createFakeLanguageTool({
        id: 1,
        name: 'Hiligaynon spell checker',
        target_locale: 'hil',
        type: ADDON_TYPE_DICT,
      }),
    ];
    store.dispatch(loadLanguageTools({ languageTools: addons }));

    render();

    // We do not currently support `hil` and we do not want the add-on to be
    // listed as part of the `hi` language.
    expect(
      screen.queryByClassName('LanguageTools-table-row'),
    ).not.toBeInTheDocument();
  });

  it('renders add-ons on two different rows corresponding to two supported languages', () => {
    // The short locale is `fa` here, which is in the list of supported
    // languages (`src/amo/languages.js`) together with `fa-IR`.
    const addons = [
      createFakeLanguageTool({
        id: 1,
        lang,
        name: 'Persian Dictionary',
        target_locale: 'fa',
        type: ADDON_TYPE_DICT,
      }),
      createFakeLanguageTool({
        id: 2,
        lang,
        name: 'Persian (IR) Dictionary',
        target_locale: 'fa-IR',
        type: ADDON_TYPE_DICT,
      }),
      createFakeLanguageTool({
        id: 3,
        lang,
        name: 'Lilak, Persian Spell Checker Dictionary',
        target_locale: 'fa-IR',
        type: ADDON_TYPE_DICT,
      }),
    ];

    store.dispatch(loadLanguageTools({ languageTools: addons }));

    render();

    const rows = screen.getAllByClassName('LanguageTools-table-row');
    expect(rows).toHaveLength(2);

    expect(within(rows[0]).getByText('Persian Dictionary')).toBeInTheDocument();
    expect(
      within(rows[1]).getByText('Persian (IR) Dictionary'),
    ).toBeInTheDocument();
    expect(
      within(rows[1]).getByText('Lilak, Persian Spell Checker Dictionary'),
    ).toBeInTheDocument();
  });

  it('renders meta tags', async () => {
    render();

    await waitFor(() =>
      expect(getElement('meta[name="description"]')).toBeInTheDocument(),
    );

    expect(getElement('meta[name="description"]')).toHaveAttribute(
      'content',
      expect.stringContaining('Download Firefox dictionaries and language'),
    );
  });

  it('renders links via the HeadLinks component', async () => {
    render();

    await waitFor(() =>
      expect(getElement('link[rel="canonical"]')).toBeInTheDocument(),
    );

    expect(getElement('link[rel="canonical"]')).toHaveAttribute(
      'href',
      getCanonicalURL({ locationPathname: `/${lang}/firefox/language-tools/` }),
    );
  });
});
