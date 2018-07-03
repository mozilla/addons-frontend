import * as React from 'react';
import { compose } from 'redux';

import reducer, { generateId, withUIState } from 'core/reducers/uiState';
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
  });

  describe('generateId', () => {
    it('generates an ID', () => {
      expect(generateId({ fileName: __filename, id: 'any-id' })).toEqual('foo');
    });
  });
});
