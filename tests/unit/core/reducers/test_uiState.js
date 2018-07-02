import * as React from 'react';
import { compose } from 'redux';

import reducer, { withUIState } from 'core/reducers/uiState';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { applyUIStateChanges, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('withUIState', () => {
    let store;

    class OverlayBase extends React.Component {
      componentWillMount() {
        this.props.setUIState({ isOpen: true });
      }

      onClick = () => {
        this.props.setUIState({ isOpen: false });
      };

      render() {
        const { uiState } = this.props;

        if (!uiState.isOpen) {
          return null;
        }

        return (
          <button className="close-button" onClick={this.onClick}>
            Close overlay
          </button>
        );
      }
    }

    const Overlay = compose(
      withUIState({
        fileName: __filename,
        extractId: (props) => '',
      }),
    )(OverlayBase);

    const render = (props = {}) => {
      const root = shallowUntilTarget(
        <Overlay store={store} {...props} />,
        OverlayBase,
      );
      // Apply initial state change on mount.
      applyUIStateChanges({ root, store });
      return root;
    };

    beforeEach(() => {
      store = dispatchClientMetadata().store;
    });

    it('lets you set UI state', () => {
      const root = render();

      // Make sure you can close the overlay.
      expect(root.find('.close-button')).toHaveLength(1);
      root.find('.close-button').simulate('click');
      applyUIStateChanges({ root, store });
      expect(root.find('.close-button')).toHaveLength(0);
    });
  });
});
