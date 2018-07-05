/* eslint-disable react/no-multi-comp, react/prop-types */
import * as React from 'react';
import { compose } from 'redux';

import withUIState, { generateId } from 'core/withUIState';
import { setUIState } from 'core/reducers/uiState';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { applyUIStateChanges, shallowUntilTarget } from 'tests/unit/helpers';

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
        initialState: { isOpen: true },
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

    it('begins with an initial state', () => {
      class ThingBase extends React.Component {
        render() {
          return <div />;
        }
      }
      const initialState = { visible: true };

      const Thing = compose(
        withUIState({
          fileName: __filename,
          extractId: () => '',
          initialState,
        }),
      )(ThingBase);

      const root = shallowUntilTarget(<Thing store={store} />, ThingBase);

      expect(root.instance().props.uiState).toEqual(initialState);
    });

    it('always resets initial state per component instance', () => {
      class ThingBase extends React.Component {
        render() {
          return <div />;
        }
      }
      const initialState = { visible: true };

      const Thing = compose(
        withUIState({
          fileName: __filename,
          // Each instance will share this same ID.
          extractId: () => 'shared-ID',
          initialState,
        }),
      )(ThingBase);

      // Create an instance and change its state.
      const root1 = shallowUntilTarget(<Thing store={store} />, ThingBase);
      root1.instance().props.setUIState({ visible: false });
      applyUIStateChanges({ root: root1, store });
      expect(root1.instance().props.uiState.visible).toEqual(false);

      // Create a second instance and make sure the state was reset.
      const root2 = shallowUntilTarget(<Thing store={store} />, ThingBase);
      applyUIStateChanges({ root: root2, store });
      expect(root2.instance().props.uiState).toEqual(initialState);
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
});
