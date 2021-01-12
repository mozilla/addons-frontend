import reducer, {
  initialState,
  showSurvey,
  dismissSurvey,
} from 'amo/reducers/survey';

describe(__filename, () => {
  it('shows a survey by default', () => {
    expect(reducer(undefined, { type: 'ANOTHER_ACTION' })).toEqual({
      ...initialState,
      wasDismissed: false,
    });
  });

  it('dismisses a survey', () => {
    let state;
    state = reducer(state, showSurvey());
    state = reducer(state, dismissSurvey());

    expect(state.wasDismissed).toEqual(true);
  });

  it('shows a survey', () => {
    let state;
    state = reducer(state, dismissSurvey());
    state = reducer(state, showSurvey());

    expect(state.wasDismissed).toEqual(false);
  });
});
