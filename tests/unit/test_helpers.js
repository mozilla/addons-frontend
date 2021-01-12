/* eslint-disable react/no-multi-comp, max-classes-per-file */
import React, { Component } from 'react';
import { ConnectedRouter } from 'connected-react-router';
import { shallow, mount } from 'enzyme';
import { createMemoryHistory } from 'history';
import { compose } from 'redux';
import { Provider } from 'react-redux';
import { Route } from 'react-router-dom';
import SagaTester from 'redux-saga-tester';
import { put, takeLatest } from 'redux-saga/effects';

import createStore from 'amo/store';
import { addQueryParamsToHistory } from 'amo/utils';
import {
  getFakeConfig,
  matchingSagaAction,
  onLocationChanged,
  normalizeSpaces,
  shallowUntilTarget,
  unexpectedSuccess,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('shallowUntilTarget', () => {
    function ExampleBase() {
      return <div>Example component</div>;
    }

    function wrapper() {
      return function Wrapper(WrappedComponent) {
        return function InnerWrapper(props) {
          return <WrappedComponent {...props} />;
        };
      };
    }

    it('requires a componentInstance', () => {
      expect(() => shallowUntilTarget(undefined, ExampleBase)).toThrow(
        'componentInstance parameter is required',
      );
    });

    it('requires a valid component instance', () => {
      expect(() => {
        shallowUntilTarget({ notAComponent: true }, ExampleBase);
      }).toThrow(/ShallowWrapper can only wrap valid elements/);
    });

    it('requires a TargetComponent', () => {
      const Example = compose(wrapper())(ExampleBase);

      expect(() => shallowUntilTarget(<Example />, undefined)).toThrow(
        'TargetComponent parameter is required',
      );
    });

    it('lets you unwrap a component one level', () => {
      const Example = compose(wrapper())(ExampleBase);

      const root = shallowUntilTarget(<Example />, ExampleBase);
      expect(root.text()).toEqual('Example component');
    });

    it('lets you unwrap a component two levels', () => {
      const Example = compose(wrapper(), wrapper())(ExampleBase);

      const root = shallowUntilTarget(<Example />, ExampleBase);
      expect(root.text()).toEqual('Example component');
    });

    it('lets you unwrap a React class based component', () => {
      class ReactExampleBase extends Component {
        render() {
          return <div>example of class based component</div>;
        }
      }

      const Example = compose(wrapper())(ReactExampleBase);

      const root = shallowUntilTarget(<Example />, ReactExampleBase);
      expect(root.instance()).toBeInstanceOf(ReactExampleBase);
    });

    it('does not let you unwrap a component that is not wrapped', () => {
      expect(() => {
        shallowUntilTarget(<ExampleBase />, ExampleBase);
      }).toThrow(/Cannot unwrap this component because it is not wrapped/);
    });

    it('gives up trying to unwrap component after maxTries', () => {
      const Example = compose(wrapper(), wrapper(), wrapper())(ExampleBase);

      expect(() => {
        shallowUntilTarget(<Example />, ExampleBase, {
          maxTries: 2,
        });
      }).toThrow(/Could not find .*gave up after 2 tries/);
    });

    it('lets you pass options to shallow()', () => {
      const shallowStub = sinon.spy(shallow);

      const Example = compose(wrapper())(ExampleBase);

      const shallowOptions = {
        lifecycleExperimental: true,
      };
      const instance = <Example />;
      shallowUntilTarget(instance, ExampleBase, {
        shallowOptions,
        _shallow: shallowStub,
      });

      sinon.assert.calledWith(shallowStub, instance, shallowOptions);
    });

    it('lets you pass options to the final shallow()', () => {
      const componentDidUpdate = sinon.stub();

      class LifecyleExample extends Component {
        componentDidUpdate() {
          componentDidUpdate();
        }

        render() {
          return <div>example of using lifecycle methods</div>;
        }
      }

      const Example = compose(wrapper())(LifecyleExample);

      const root = shallowUntilTarget(<Example />, LifecyleExample, {
        shallowOptions: {
          lifecycleExperimental: true,
        },
      });
      root.setProps({ something: 'else' });

      sinon.assert.called(componentDidUpdate);
    });
  });

  describe('matchingSagaAction', () => {
    const START_EXAMPLE = '@@addons-frontend/start-example';
    const EXAMPLE_ACTION = '@@addons-frontend/example-action';

    function startSagaTester(handler, { startSaga = true } = {}) {
      const sagaTester = new SagaTester({
        initialState: {},
        reducers: { example: (state = {}) => state },
      });

      function* exampleSaga() {
        yield takeLatest(START_EXAMPLE, handler);
      }

      sagaTester.start(exampleSaga);
      if (startSaga) {
        sagaTester.dispatch({ type: START_EXAMPLE });
      }

      return sagaTester;
    }

    it('waits for a matched action', async () => {
      function* exampleHandler() {
        yield put({ type: EXAMPLE_ACTION, payload: { order: 'first' } });
        yield put({ type: EXAMPLE_ACTION, payload: { order: 'second' } });
      }

      const sagaTester = startSagaTester(exampleHandler);

      await matchingSagaAction(sagaTester, (action) => {
        return (
          action.type === EXAMPLE_ACTION && action.payload.order === 'second'
        );
      });
    });

    it('returns the matched action', async () => {
      const firstValue = 'first';
      const secondValue = 'second';

      const makeAction = (value) => {
        return {
          type: EXAMPLE_ACTION,
          payload: { order: value },
        };
      };

      function* exampleHandler() {
        yield put(makeAction(firstValue));
        yield put(makeAction(secondValue));
      }

      const sagaTester = startSagaTester(exampleHandler);

      const returnedAction = await matchingSagaAction(sagaTester, (action) => {
        return (
          action.type === EXAMPLE_ACTION && action.payload.order === secondValue
        );
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
      const actionTypes = [
        '@@addons-frontend/first-action',
        '@@addons-frontend/second-action',
        '@@addons-frontend/third-action',
      ];

      function* exampleHandler() {
        for (const actionType of actionTypes) {
          yield put({ type: actionType });
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
      function* exampleHandler() {
        // No actions are dispatched in this handler.
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

      expect(error.message).toMatch(
        /saga dispatched these action types.*none at all/,
      );
    });
  });

  describe('getFakeConfig', () => {
    it('throws an error when key is invalid', () => {
      expect(() => {
        getFakeConfig({ thisIsAnInvalidKey: true });
      }).toThrow(/this key is invalid/);
    });

    it('does not throw when key is invalid and allowUnknownKeys is set to true', () => {
      const value = 'some value';
      const config = getFakeConfig(
        { thisIsAnInvalidKey: value },
        { allowUnknownKeys: true },
      );

      expect(config.get('thisIsAnInvalidKey')).toEqual(value);
    });
  });

  describe('onLocationChanged', () => {
    // If this test case fails, it means `connected-react-router` has changed
    // its `onLocationChanged` redux action.
    // See: https://github.com/mozilla/addons-frontend/issues/6560
    it('returns the same payload as the connected-react-router action', () => {
      const history = addQueryParamsToHistory({
        history: createMemoryHistory(),
      });

      const { store } = createStore({ history });
      const dispatchSpy = sinon.spy(store, 'dispatch');

      mount(
        <Provider store={store}>
          <ConnectedRouter history={history}>
            <Route path="/" render={() => <div>Welcome</div>} />
          </ConnectedRouter>
        </Provider>,
      );

      dispatchSpy.resetHistory();

      const pathname = '/foo';
      history.push(pathname);

      sinon.assert.calledWith(
        dispatchSpy,
        onLocationChanged({ pathname, key: sinon.match.string }),
      );
      sinon.assert.calledOnce(dispatchSpy);
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
