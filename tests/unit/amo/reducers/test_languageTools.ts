import { setLang } from 'amo/reducers/api';
import reducer, { createInternalLanguageTool, getAllLanguageTools, initialState, loadLanguageTools } from 'amo/reducers/languageTools';
import { createFakeLanguageTool, dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  it('initializes properly', () => {
    const state = reducer(undefined, {});
    expect(state).toEqual(initialState);
  });
  it('stores language tools', () => {
    const lang = 'fr';
    const language = createFakeLanguageTool({
      lang,
    });
    const stateWithLang = reducer(undefined, setLang(lang));
    const state = reducer(stateWithLang, loadLanguageTools({
      languageTools: [language],
    }));
    expect(state).toEqual({
      byID: {
        [language.id]: createInternalLanguageTool(language, lang),
      },
      lang,
    });
  });
  it('ignores unrelated actions', () => {
    const lang = 'fr';
    const language = createFakeLanguageTool({
      lang,
    });
    const stateWithLang = reducer(undefined, setLang(lang));
    const firstState = reducer(stateWithLang, loadLanguageTools({
      languageTools: [language],
    }));
    expect(reducer(firstState, {
      type: 'UNRELATED_ACTION',
    })).toEqual(firstState);
  });
  describe('getAllLanguageTools', () => {
    it('returns an empty array when no languages are stored', () => {
      const {
        state,
      } = dispatchClientMetadata();
      expect(getAllLanguageTools(state)).toEqual([]);
    });
    it('returns an array of languages', () => {
      const lang = 'fr';
      const language = createFakeLanguageTool({
        lang,
      });
      const {
        store,
      } = dispatchClientMetadata({
        lang,
      });
      store.dispatch(loadLanguageTools({
        languageTools: [language],
      }));
      expect(getAllLanguageTools(store.getState())).toEqual([createInternalLanguageTool(language, lang)]);
    });
  });
});