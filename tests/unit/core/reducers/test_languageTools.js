import reducer, {
  fetchLanguageTools,
  getAllLanguageTools,
  initialState,
  loadLanguageTools,
} from 'core/reducers/languageTools';
import { createFakeLanguageTool } from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  it('initializes properly', () => {
    const state = reducer(undefined, {});

    expect(state).toEqual(initialState);
  });

  it('stores language tools', () => {
    const language = createFakeLanguageTool();
    const state = reducer(undefined, loadLanguageTools({
      languageTools: [language],
    }));

    expect(state).toEqual({
      byID: {
        [language.id]: language,
      },
    });
  });

  it('ignores unrelated actions', () => {
    const language = createFakeLanguageTool();
    const firstState = reducer(undefined, loadLanguageTools({
      languageTools: [language],
    }));

    expect(reducer(firstState, { type: 'UNRELATED_ACTION' }))
      .toEqual(firstState);
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
      const language = createFakeLanguageTool();
      const { store } = dispatchClientMetadata();
      store.dispatch(loadLanguageTools({ languageTools: [language] }));

      expect(getAllLanguageTools(store.getState())).toEqual([language]);
    });
  });
});
