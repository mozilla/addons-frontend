/* eslint-disable react/no-multi-comp, max-classes-per-file */
import React from 'react';
import { createMemoryHistory } from 'history';
import { Provider } from 'react-redux';
import { Route, Router } from 'react-router-dom';
import SagaTester from 'redux-saga-tester';
import { put, takeLatest } from 'redux-saga/effects';
import { render } from '@testing-library/react';

import createStore from 'amo/store';
import { addQueryParamsToHistory } from 'amo/utils';
import { getFakeConfig, matchingSagaAction, onLocationChanged, normalizeSpaces, unexpectedSuccess } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('matchingSagaAction', () => {
    const START_EXAMPLE = '@@addons-frontend/start-example';
    const EXAMPLE_ACTION = '@@addons-frontend/example-action';

    function startSagaTester(handler, {
      startSaga = true,
    } = {}) {
      const sagaTester = new SagaTester({
        initialState: {},
        reducers: {
          example: (state = {}) => state,
        },
      });

      function* exampleSaga() {
        yield takeLatest(START_EXAMPLE, handler);
      }

      sagaTester.start(exampleSaga);

      if (startSaga) {
        sagaTester.dispatch({
          type: START_EXAMPLE,
        });
      }

      return sagaTester;
    }

    it('waits for a matched action', async () => {
      function* exampleHandler() {
        yield put({
          type: EXAMPLE_ACTION,
          payload: {
            order: 'first',
          },
        });
        yield put({
          type: EXAMPLE_ACTION,
          payload: {
            order: 'second',
          },
        });
      }

      const sagaTester = startSagaTester(exampleHandler);
      await matchingSagaAction(sagaTester, (action) => {
        return action.type === EXAMPLE_ACTION && action.payload.order === 'second';
      });
    });
    it('returns the matched action', async () => {
      const firstValue = 'first';
      const secondValue = 'second';

      const makeAction = (value) => {
        return {
          type: EXAMPLE_ACTION,
          payload: {
            order: value,
          },
        };
      };

      function* exampleHandler() {
        yield put(makeAction(firstValue));
        yield put(makeAction(secondValue));
      }

      const sagaTester = startSagaTester(exampleHandler);
      const returnedAction = await matchingSagaAction(sagaTester, (action) => {
        return action.type === EXAMPLE_ACTION && action.payload.order === secondValue;
      });
      expect(returnedAction).toEqual(makeAction(secondValue));
    });
    it('gives up matching the action after maxTries', async () => {
      // eslint-disable-next-line no-empty-function
      function* exampleHandler() {}

      const sagaTester = startSagaTester(exampleHandler);
      let error;
      await matchingSagaAction(sagaTester, () => false, {
        maxTries: 4,
      }).then(unexpectedSuccess, (caughtError) => {
        error = caughtError;
      });
      expect(error.message).toMatch(/matcher function did not return true/);
    });
    it('tells you which actions were dispatched on error', async () => {
      const actionTypes = ['@@addons-frontend/first-action', '@@addons-frontend/second-action', '@@addons-frontend/third-action'];

      function* exampleHandler() {
        for (const actionType of actionTypes) {
          yield put({
            type: actionType,
          });
        }
      }

      const sagaTester = startSagaTester(exampleHandler);
      let error;
      await matchingSagaAction(sagaTester, () => false, {
        maxTries: 4,
      }).then(unexpectedSuccess, (caughtError) => {
        error = caughtError;
      });

      for (const actionType of actionTypes) {
        expect(error.message).toContain(actionType);
      }
    });
    it('tells you if no actions were dispatched at all', async () => {
      function* exampleHandler() {// No actions are dispatched in this handler.
      }

      const sagaTester = startSagaTester(exampleHandler, {
        // Don't dispatch a start action.
        startSaga: false,
      });
      let error;
      await matchingSagaAction(sagaTester, () => false, {
        maxTries: 4,
      }).then(unexpectedSuccess, (caughtError) => {
        error = caughtError;
      });
      expect(error.message).toMatch(/saga dispatched these action types.*none at all/);
    });
  });
  describe('getFakeConfig', () => {
    it('throws an error when key is invalid', () => {
      expect(() => {
        getFakeConfig({
          thisIsAnInvalidKey: true,
        });
      }).toThrow(/this key is invalid/);
    });
    it('does not throw when key is invalid and allowUnknownKeys is set to true', () => {
      const value = 'some value';
      const config = getFakeConfig({
        thisIsAnInvalidKey: value,
      }, {
        allowUnknownKeys: true,
      });
      expect(config.get('thisIsAnInvalidKey')).toEqual(value);
    });
  });
  describe('onLocationChanged', () => {
    // If this test case fails, it means `redux-first-history` has changed
    // its `onLocationChanged` redux action.
    // See: https://github.com/mozilla/addons-frontend/issues/6560
    it('returns the same payload as the redux-first-history action', () => {
      const history = addQueryParamsToHistory({
        history: createMemoryHistory(),
      });
      const {
        connectedHistory,
        store,
      } = createStore({
        history,
      });
      const dispatch = jest.spyOn(store, 'dispatch');
      render(<Provider store={store}>
          <Router history={connectedHistory}>
            <Route path="/" render={() => <div>Welcome</div>} />
          </Router>
        </Provider>);
      dispatch.mockClear();
      const pathname = '/foo';
      history.push(pathname);
      const expected = { ...onLocationChanged({
          pathname,
        }),
      };
      expected.payload.location = { ...expected.payload.location,
        key: expect.any(String),
      };
      expect(dispatch).toHaveBeenCalledWith(expected);
      expect(dispatch).toHaveBeenCalledOnce();
    });
  });
  describe('normalizeSpaces', () => {
    it('replaces non-breaking space code points', () => {
      expect(normalizeSpaces('\u202F_thing')).toEqual(' _thing');
    });
    it('normalizes all spaces', () => {
      expect(normalizeSpaces('\u202F_thing_\u202F')).toEqual(' _thing_ ');
    });
    it('ignores falsy values', () => {
      expect(normalizeSpaces(null)).toEqual(null);
    });
  });
});