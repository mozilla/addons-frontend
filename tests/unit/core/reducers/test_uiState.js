/* eslint-disable react/no-multi-comp, react/prop-types */
import * as React from 'react';
import { compose } from 'redux';

import reducer, {
  generateId,
  setUIState,
  withUIState,
} from 'core/reducers/uiState';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { applyUIStateChanges, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('withUIState', () => {
    let store;

    class OverlayBase extends React.Component {
      componentWillMount() {
        this.props.setUIState({ isOpen: true });
      }

      closeOverlay = () => {
        this.props.setUIState({ isOpen: false });
      };

      render() {
        const { uiState } = this.props;

        if (!uiState.isOpen) {
          return null;
        }

        return (
          <div className="overlay">
            <button className="close-button" onClick={this.closeOverlay}>
              Close overlay
            </button>
          </div>
        );
      }
    }

    const Overlay = compose(
      withUIState({
        fileName: __filename,
        extractId: (props) => props.id,
      }),
    )(OverlayBase);

    const render = ({ id = 'some-id', ...props } = {}) => {
      const root = shallowUntilTarget(
        <Overlay id={id} store={store} {...props} />,
        OverlayBase,
      );
      // Apply initial state change from componentWillMount.
      applyUIStateChanges({ root, store });
      return root;
    };

    beforeEach(() => {
      store = dispatchClientMetadata().store;
    });

    it('lets you manage UI state', () => {
      const root = render();
      expect(root.find('.overlay')).toHaveLength(1);

      // Test that closing the overlay is hooked up to uiState.
      root.find('.close-button').simulate('click');
      applyUIStateChanges({ root, store });

      expect(root.find('.overlay')).toHaveLength(0);
    });

    it('separates state by instance', () => {
      const root1 = render({ id: 'one' });
      const root2 = render({ id: 'two' });

      // The first overlay should be open.
      expect(root1.find('.overlay')).toHaveLength(1);

      // Close the second overlay.
      root2.find('.close-button').simulate('click');

      applyUIStateChanges({ root: root1, store });
      applyUIStateChanges({ root: root2, store });

      // The first overlay should still be open.
      expect(root1.find('.overlay')).toHaveLength(1);
    });

    it('begins with a default state', () => {
      class ThingBase extends React.Component {
        render() {
          return <div />;
        }
      }
      const defaultState = { visible: true };

      const Thing = compose(
        withUIState({
          fileName: __filename,
          extractId: () => '',
          defaultState,
        }),
      )(ThingBase);

      const root = shallowUntilTarget(<Thing store={store} />, ThingBase);

      expect(root.instance().props.uiState).toEqual(defaultState);
    });

    it('lets you set a custom uiStateID', () => {
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const uiStateID = 'my-custom-id';
      const root = render({ uiStateID });

      root.find('.close-button').simulate('click');

      sinon.assert.calledWith(
        dispatchSpy,
        setUIState({
          id: uiStateID,
          change: { isOpen: true },
        }),
      );
    });
  });

  describe('generateId', () => {
    it('generates an ID', () => {
      const id = 'any-id';
      const fileName = 'src/some-file.js';
      expect(generateId({ fileName, id })).toEqual(`${fileName}-${id}`);
    });
  });

  describe('reducer', () => {
    it('lets you set UI state', () => {
      const id = 'component-instance-id';

      const state = reducer(
        undefined,
        setUIState({
          id,
          change: { color: 'red' },
        }),
      );

      expect(state[id].color).toEqual('red');
    });

    it('preserves existing component state', () => {
      const id = 'component-instance-id';

      let state;
      state = reducer(
        state,
        setUIState({
          id,
          change: { color: 'red' },
        }),
      );
      state = reducer(
        state,
        setUIState({
          id,
          change: { mood: 'blue' },
        }),
      );

      expect(state[id].color).toEqual('red');
      expect(state[id].mood).toEqual('blue');
    });

    it('changes existing component state', () => {
      const id = 'component-instance-id';

      let state;
      state = reducer(
        state,
        setUIState({
          id,
          change: { color: 'red' },
        }),
      );
      state = reducer(
        state,
        setUIState({
          id,
          change: { color: 'magenta' },
        }),
      );

      expect(state[id].color).toEqual('magenta');
    });

    it('preserves other state for other components', () => {
      const id1 = 'component-instance1';
      const id2 = 'component-instance2';

      let state;
      state = reducer(
        state,
        setUIState({
          id: id1,
          change: { color: 'red' },
        }),
      );
      state = reducer(
        state,
        setUIState({
          id: id2,
          change: { size: 'large' },
        }),
      );

      expect(state[id1].color).toEqual('red');
      expect(state[id2].size).toEqual('large');
    });

    it('ignores unrelated actions', () => {
      const id = 'component-instance-id';

      let state;
      state = reducer(
        state,
        setUIState({
          id,
          change: { color: 'red' },
        }),
      );
      state = reducer(state, { type: 'ANOTHER_ACTION', payload: {} });

      expect(state[id].color).toEqual('red');
    });
  });
});
