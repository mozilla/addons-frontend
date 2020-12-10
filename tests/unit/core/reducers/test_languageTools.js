import reducer, {
  createInternalLanguageTool,
  fetchLanguageTools,
  getAllLanguageTools,
  initialState,
  loadLanguageTools,
} from 'core/reducers/languageTools';
import {
  DEFAULT_LANG_IN_TESTS,
  createFakeLanguageTool,
  dispatchClientMetadata,
} from 'tests/unit/helpers';

describe(__filename, () => {
  it('initializes properly', () => {
    const state = reducer(undefined, {});

    expect(state).toEqual(initialState);
  });

  it('stores language tools', () => {
    const language = createFakeLanguageTool();
    const state = reducer(
      undefined,
      loadLanguageTools({
        languageTools: [language],
      }),
    );

    expect(state).toEqual({
      byID: {
        [language.id]: createInternalLanguageTool(
          language,
          DEFAULT_LANG_IN_TESTS,
        ),
      },
    });
  });

  it('ignores unrelated actions', () => {
    const language = createFakeLanguageTool();
    const firstState = reducer(
      undefined,
      loadLanguageTools({
        languageTools: [language],
      }),
    );

    expect(reducer(firstState, { type: 'UNRELATED_ACTION' })).toEqual(
      firstState,
    );
  });

  describe('fetchLanguageTools', () => {
    it('requires an errorHandlerId', () => {
      expect(() => {
        fetchLanguageTools();
      }).toThrow('errorHandlerId is required');
    });
  });

  describe('loadLanguageTools', () => {
    it('requires language tools', () => {
      expect(() => {
        loadLanguageTools();
      }).toThrow('languageTools are required');
    });
  });

  describe('getAllLanguageTools', () => {
    it('returns an empty array when no languages are stored', () => {
      const { state } = dispatchClientMetadata();

      expect(getAllLanguageTools(state)).toEqual([]);
    });

    it('returns an array of languages', () => {
      const lang = 'fr';
      const language = createFakeLanguageTool({ target_locale: lang });
      const { store } = dispatchClientMetadata();
      store.dispatch(loadLanguageTools({ languageTools: [language] }));

      expect(getAllLanguageTools(store.getState())).toEqual([
        createInternalLanguageTool(language, lang),
      ]);
    });
  });
});
