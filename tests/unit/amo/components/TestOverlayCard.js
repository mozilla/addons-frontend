import * as React from 'react';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { extractId } from 'amo/components/Overlay';
import OverlayCard from 'amo/components/OverlayCard';
import { setUIState } from 'amo/reducers/uiState';
import {
  dispatchClientMetadata,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const id = 'OverlayCard';
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  function render({ overlayChildren, ...props } = {}) {
    const html = <div>a child div</div>;

    return defaultRender(
      <OverlayCard id={id} {...props}>
        {overlayChildren || html}
      </OverlayCard>,
      { store },
    );
  }

  it('passes the header', () => {
    const header = 'This is a header';
    render({ header });

    expect(screen.getByText(header)).toBeInTheDocument();
  });

  it('passes a footer link', () => {
    const linkText = 'a link';
    const linkHref = '/some/path/';
    render({ footerLink: <a href={linkHref}>{linkText}</a> });

    expect(screen.getByRole('link', { name: linkText })).toHaveAttribute(
      'href',
      linkHref,
    );
  });

  it('passes footer text', () => {
    const footerText = 'footer text';
    render({ footerText });

    expect(screen.getByText(footerText)).toBeInTheDocument();
  });

  it('passes children', () => {
    const childText = 'hi';
    render({ overlayChildren: <div className="kids">hi</div> });

    expect(screen.getByText(childText)).toBeInTheDocument();
  });

  describe('Tests for Overlay', () => {
    it('is hidden by default', () => {
      render();

      expect(screen.getByClassName('Overlay')).not.toHaveClass(
        'Overlay--visible',
      );
    });

    it('becomes visible when its mounted with visibleOnLoad prop as true', () => {
      render({ visibleOnLoad: true });

      expect(screen.getByClassName('Overlay')).toHaveClass('Overlay--visible');
    });

    it('becomes visible when the UIState changes to visible: true', () => {
      render();

      expect(screen.getByClassName('Overlay')).not.toHaveClass(
        'Overlay--visible',
      );

      store.dispatch(
        setUIState({
          id: `src/amo/components/Overlay/index.js-${id}`,
          change: { visible: true },
        }),
      );

      expect(screen.getByClassName('Overlay')).toHaveClass('Overlay--visible');
    });

    it('renders extra className if provided', () => {
      const className = 'I-am-so-over-it';
      render({ className });

      expect(screen.getByClassName('OverlayCard')).toHaveClass(className);
    });

    it('renders children', () => {
      const text = 'overriding div text..';
      render({ overlayChildren: text });

      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('calls onEscapeOverlay when clicking the background', () => {
      const onEscapeOverlay = jest.fn();
      render({ onEscapeOverlay });

      userEvent.click(screen.getByRole('presentation'));

      expect(onEscapeOverlay).toHaveBeenCalled();
    });

    it('hides when you click the background', () => {
      render({ visibleOnLoad: true });

      expect(screen.getByClassName('Overlay')).toHaveClass('Overlay--visible');

      userEvent.click(screen.getByRole('presentation'));

      expect(screen.getByClassName('Overlay')).not.toHaveClass(
        'Overlay--visible',
      );
    });

    it('hides when the "Esc" key is pressed', () => {
      render({ visibleOnLoad: true });

      expect(screen.getByClassName('Overlay')).toHaveClass('Overlay--visible');

      // This clicks the Escape key.
      fireEvent.keyDown(screen.getByClassName('Overlay'), {
        key: 'Escape',
        keyCode: 27,
        which: 27,
      });

      expect(screen.getByClassName('Overlay')).not.toHaveClass(
        'Overlay--visible',
      );
    });

    describe('extractId', () => {
      it('returns a unique ID provided by the ID prop', () => {
        const theId = 'some-id';
        expect(extractId({ id: theId })).toEqual(theId);
      });
    });
  });
});
