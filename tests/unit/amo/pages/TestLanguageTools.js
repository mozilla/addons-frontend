import { waitFor } from '@testing-library/react';

import { ADDON_TYPE_DICT, ADDON_TYPE_LANG } from 'amo/constants';
import { loadLanguageTools } from 'amo/reducers/languageTools';
import { getCanonicalURL } from 'amo/utils';
import {
  createFakeLanguageTool,
  createHistory,
  dispatchClientMetadata,
  getElement,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const lang = 'fr';
  const languageTools = [
    createFakeLanguageTool({
      id: 1,
      lang,
      name: 'Scottish Language Pack (with Irn-Bru)',
      target_locale: 'en-GB',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 2,
      lang,
      name: 'Old stuffy English',
      target_locale: 'en-GB',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 3,
      lang,
      name: 'English Language Pack with Extra Us',
      target_locale: 'en-GB',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 4,
      lang,
      name: 'Cool new English',
      target_locale: 'en-US',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 5,
      lang,
      name: 'le French Dictionary',
      target_locale: 'fr',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 6,
      lang,
      name: 'French Language Pack',
      target_locale: 'fr',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 7,
      lang,
      name: 'اُردو',
      target_locale: 'ur',
      type: ADDON_TYPE_DICT,
    }),
    createFakeLanguageTool({
      id: 8,
      lang,
      name: '正體中文 (繁體)',
      target_locale: 'zh-TW',
      type: ADDON_TYPE_LANG,
    }),
    createFakeLanguageTool({
      id: 9,
      lang,
      name: 'isiZulu',
      target_locale: 'zu',
      type: ADDON_TYPE_LANG,
    }),
  ];

  function render({ store = dispatchClientMetadata().store } = {}) {
    return defaultRender({
      history: createHistory({
        initialEntries: [`/${lang}/firefox/language-tools/`],
      }),
      store,
    });
  }

  it('renders LoadingText if language tools are not set', () => {
    render();

    expect(screen.queryAllByClassName('LoadingText').length).toBeGreaterThan(0);
  });

  it('renders LoadingText if language tools are empty', () => {
    const { store } = dispatchClientMetadata({ lang });
    store.dispatch(loadLanguageTools({ languageTools: [] }));

    render({ store });

    expect(screen.queryAllByClassName('LoadingText').length).toBeGreaterThan(0);
  });

  it('renders language tools in your locale', () => {
    const { store } = dispatchClientMetadata({ lang: 'fr' });
    store.dispatch(loadLanguageTools({ languageTools }));

    render({ store, lang: 'fr' });

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
    expect(langPack).toBeInTheDocument();
    expect(
      within(langPack).getByText('French Language Pack'),
    ).toBeInTheDocument();
  });

  it('omits "language tools in your locale" section if none available', () => {
    const { store } = dispatchClientMetadata({ lang: 'pt-BR' });
    store.dispatch(loadLanguageTools({ languageTools }));

    render({ store, lang: 'pt-BR' });

    expect(
      screen.queryByRole('heading', { name: 'Available for your locale' }),
    ).not.toBeInTheDocument();
  });

  it('renders language packs in the table view for the right language', () => {
    const { store } = dispatchClientMetadata({ lang });
    store.dispatch(loadLanguageTools({ languageTools }));

    render({ store });

    expect(
      screen.getByClassName('LanguageTools-lang-en-GB'),
    ).toBeInTheDocument();
    expect(
      screen.getByClassName('LanguageTools-lang-en-US'),
    ).toBeInTheDocument();
    expect(screen.getByClassName('LanguageTools-lang-fr')).toBeInTheDocument();
    expect(screen.getByClassName('LanguageTools-lang-ur')).toBeInTheDocument();
    expect(
      screen.getByClassName('LanguageTools-lang-zh-TW'),
    ).toBeInTheDocument();
    // Zulu is not a supported locale on the site but since Firefox UI locales
    // are not necessarily going to match the site locales we should
    // still render the zulu language pack and dictionary.
    expect(screen.getByClassName('LanguageTools-lang-zu')).toBeInTheDocument();
  });

  it('renders multiple language tools in a list', () => {
    const { store } = dispatchClientMetadata({ lang });
    store.dispatch(loadLanguageTools({ languageTools }));

    render({ store });

    const dictionaryList = within(
      screen.getByClassName('LanguageTools-lang-en-GB-dictionaries'),
    ).getAllByTagName('li');
    const languagePackList = within(
      screen.getByClassName('LanguageTools-lang-en-GB-languagePacks'),
    ).getAllByTagName('li');

    expect(dictionaryList).toHaveLength(1);
    expect(languagePackList).toHaveLength(2);
  });

  it('does not render languages we know of but do not have languages for', () => {
    const { store } = dispatchClientMetadata({ lang });
    store.dispatch(loadLanguageTools({ languageTools }));

    render({ store });

    expect(
      screen.queryByClassName('LanguageTools-lang-es'),
    ).not.toBeInTheDocument();
  });

  it('renders an HTML title', async () => {
    const { store } = dispatchClientMetadata({ lang: 'pt-BR' });
    store.dispatch(loadLanguageTools({ languageTools }));

    render({ store });

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

    const { store } = dispatchClientMetadata({ lang });
    store.dispatch(loadLanguageTools({ languageTools: addons }));

    render({ store });

    // We expect only one row with all the add-ons in it.
    const row = screen.getByClassName('LanguageTools-table-row');
    expect(row).toBeInTheDocument();
    const langPacks = within(row).getByClassName(
      'LanguageTools-lang-az-languagePacks',
    );
    expect(langPacks).toBeInTheDocument();
    expect(
      within(langPacks).getByText('Azərbaycanca (AZ) Language Pack'),
    ).toBeInTheDocument();
    const dictionaries = within(row).getByClassName(
      'LanguageTools-lang-az-dictionaries',
    );
    expect(dictionaries).toBeInTheDocument();
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
    const { store } = dispatchClientMetadata({ lang });
    store.dispatch(loadLanguageTools({ languageTools: addons }));

    render({ store });

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

    const { store } = dispatchClientMetadata({ lang });
    store.dispatch(loadLanguageTools({ languageTools: addons }));

    render({ store });

    const rows = screen.getAllByClassName('LanguageTools-table-row');
    expect(rows.length).toBe(2);

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
    const { store } = dispatchClientMetadata({ lang });
    render({ store });

    await waitFor(() =>
      expect(getElement('link[rel="canonical"]')).toBeInTheDocument(),
    );

    expect(getElement('link[rel="canonical"]')).toHaveAttribute(
      'href',
      getCanonicalURL({ locationPathname: `/${lang}/firefox/language-tools/` }),
    );
  });
});
