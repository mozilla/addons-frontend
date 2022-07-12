/* eslint-disable  react/prop-types, max-classes-per-file */
import * as React from 'react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import withUIState, { generateId } from 'amo/withUIState';
import { setUIState } from 'amo/reducers/uiState';
import {
  dispatchClientMetadata,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('withUIState', () => {
    const buttonText = 'Close overlay';
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
              {buttonText}
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
      defaultRender(<Overlay id={id} {...props} />, { store });
    };

    beforeEach(() => {
      store = dispatchClientMetadata().store;
    });

    it('sets a display name', () => {
      expect(Overlay.displayName).toMatch(/WithUIState\(OverlayBase\)/);
    });

    it('lets you manage UI state', async () => {
      render();

      // Test that closing the overlay is hooked up to uiState.
      userEvent.click(screen.getByRole('button', { name: buttonText }));

      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: buttonText }),
        ).not.toBeInTheDocument(),
      );
    });

    const propValue = 'Some prop from state';
    const newValue = 'New prop value';

    class ThingBase extends React.Component {
      render() {
        const { propFromState } = this.props.uiState;

        return <div>{propFromState}</div>;
      }
    }

    it('begins with an initial state', () => {
      const initialState = { propFromState: propValue };

      const Thing = withUIState({
        fileName: __filename,
        extractId: () => '',
        initialState,
      })(ThingBase);

      defaultRender(<Thing />, { store });

      expect(screen.getByText(propValue)).toBeInTheDocument();
    });

    it('shares state across instances', async () => {
      const initialState = { propFromState: propValue };

      const Thing = withUIState({
        fileName: __filename,
        // Each instance will share this same ID.
        extractId: () => 'shared-ID',
        initialState,
      })(ThingBase);

      // Create an instance and change its state.
      defaultRender(<Thing />, { store });
      expect(screen.getByText(propValue)).toBeInTheDocument();

      store.dispatch(
        setUIState({
          id: `${__filename}-shared-ID`,
          change: { propFromState: newValue },
        }),
      );

      expect(await screen.findByText(newValue)).toBeInTheDocument();

      // Create a second instance.
      defaultRender(<Thing />, { store });

      // Expect both instances to have the same state.
      expect(screen.getAllByText(newValue)).toHaveLength(2);
    });

    it('does not reset state when unmounting', () => {
      const NonResettingOverlay = withUIState({
        fileName: __filename,
        extractId: (props) => props.id,
        initialState: { isOpen: true },
      })(OverlayBase);

      const dispatch = jest.spyOn(store, 'dispatch');
      const { unmount } = defaultRender(
        <NonResettingOverlay id="some-component-id" />,
        { store },
      );

      dispatch.mockClear();
      unmount();

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('can reset state when unmounting', () => {
      const initialState = { isOpen: true };

      const AutoResettingOverlay = withUIState({
        fileName: __filename,
        extractId: (props) => props.id,
        initialState,
        resetOnUnmount: true,
      })(OverlayBase);

      const dispatch = jest.spyOn(store, 'dispatch');
      const { unmount } = defaultRender(
        <AutoResettingOverlay id="some-component-id" />,
        { store },
      );

      unmount();

      expect(dispatch).toHaveBeenCalledWith(
        setUIState({
          id: `${__filename}-some-component-id`,
          change: initialState,
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
