/* eslint-disable react/no-multi-comp, react/prop-types, max-classes-per-file */
import { shallow } from 'enzyme';
import * as React from 'react';

import withUIState, { generateId } from 'amo/withUIState';
import { setUIState } from 'amo/reducers/uiState';
import {
  applyUIStateChanges,
  dispatchClientMetadata,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('withUIState', () => {
    let store;

    class OverlayBase extends React.Component {
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
            <button
              className="close-button"
              onClick={this.closeOverlay}
              type="button"
            >
              Close overlay
            </button>
          </div>
        );
      }
    }

    const Overlay = withUIState({
      fileName: __filename,
      extractId: (props) => props.id,
      initialState: { isOpen: true },
    })(OverlayBase);

    const render = ({ id = 'some-id', ...props } = {}) => {
      const root = shallowUntilTarget(
        <Overlay id={id} store={store} {...props} />,
        OverlayBase,
      );
      return root;
    };

    beforeEach(() => {
      store = dispatchClientMetadata().store;
    });

    it('sets a display name', () => {
      expect(Overlay.displayName).toMatch(/WithUIState\(OverlayBase\)/);
    });

    it('lets you manage UI state', () => {
      const root = render();
      expect(root.find('.overlay')).toHaveLength(1);

      // Test that closing the overlay is hooked up to uiState.
      root.find('.close-button').simulate('click');
      applyUIStateChanges({ root, store });

      expect(root.find('.overlay')).toHaveLength(0);
    });

    it('begins with an initial state', () => {
      class ThingBase extends React.Component {
        render() {
          return <div />;
        }
      }
      const initialState = { visible: true };

      const Thing = withUIState({
        fileName: __filename,
        extractId: () => '',
        initialState,
      })(ThingBase);

      const root = shallowUntilTarget(<Thing store={store} />, ThingBase);

      expect(root.instance().props.uiState).toEqual(initialState);
    });

    it('shares state across instances', () => {
      class ThingBase extends React.Component {
        render() {
          return <div />;
        }
      }
      const initialState = { visible: true };

      const Thing = withUIState({
        fileName: __filename,
        // Each instance will share this same ID.
        extractId: () => 'shared-ID',
        initialState,
      })(ThingBase);

      // Create an instance and change its state.
      const root1 = shallowUntilTarget(<Thing store={store} />, ThingBase);
      root1.instance().props.setUIState({ visible: false });
      applyUIStateChanges({ root: root1, store });
      expect(root1.instance().props.uiState.visible).toEqual(false);

      // Create a second instance.
      const root2 = shallowUntilTarget(<Thing store={store} />, ThingBase);
      applyUIStateChanges({ root: root2, store });
      // Make sure the state is shared between the two instances.
      expect(root2.instance().props.uiState.visible).toEqual(false);
    });

    it('does not reset state when unmounting', () => {
      const NonResettingOverlay = withUIState({
        fileName: __filename,
        extractId: (props) => props.id,
        initialState: { isOpen: true },
      })(OverlayBase);

      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = shallow(
        <NonResettingOverlay store={store} id="some-component-id" />,
      )
        .find('WithUIState(OverlayBase)')
        .dive();

      root.unmount();

      sinon.assert.notCalled(dispatchSpy);
    });

    it('can reset state when unmounting', () => {
      const initialState = { isOpen: true };

      const AutoResettingOverlay = withUIState({
        fileName: __filename,
        extractId: (props) => props.id,
        initialState,
        resetOnUnmount: true,
      })(OverlayBase);

      const dispatchSpy = sinon.spy(store, 'dispatch');
      const root = shallow(
        <AutoResettingOverlay store={store} id="some-component-id" />,
      )
        .find('WithUIState(OverlayBase)')
        .dive();

      const { uiStateID } = root.instance().props;
      root.unmount();

      sinon.assert.calledWith(
        dispatchSpy,
        setUIState({
          id: uiStateID,
          change: initialState,
        }),
      );
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
          change: { isOpen: false },
        }),
      );
      sinon.assert.callCount(dispatchSpy, 1);
    });
  });

  describe('generateId', () => {
    it('generates an ID', () => {
      const id = 'any-id';
      const fileName = 'src/some-file.js';
      expect(generateId({ fileName, id })).toEqual(`${fileName}-${id}`);
    });
  });
});
