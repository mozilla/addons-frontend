import * as React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-dom/test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import Overlay from 'ui/components/Overlay';
import OverlayCard from 'ui/components/OverlayCard';

describe(__filename, () => {
  const { store } = createStore();

  const getProps = ({ ...props } = {}) => {
    return {
      className: 'OverlayCard',
      id: 'OverlayCard',
      store,
      ...props,
    };
  };

  function render(props = {}) {
    return findRenderedComponentWithType(
      renderIntoDocument(
        <Provider store={store}>
          <OverlayCard {...getProps(props)} />
        </Provider>,
      ),
      OverlayCard,
    );
  }

  it('renders an OverlayCard', () => {
    const root = render();
    expect(root.props.className).toEqual('OverlayCard');
  });

  it('passes onEscapeOverlay to Overlay', () => {
    const onEscapeOverlay = sinon.stub();
    const root = render({ onEscapeOverlay });
    const overlay = findRenderedComponentWithType(root, Overlay);
    expect(overlay.props.onEscapeOverlay).toEqual(onEscapeOverlay);
  });

  it('passes the header', () => {
    const root = render({ header: 'header' });
    const rootNode = findDOMNode(root);

    expect(rootNode.querySelector('.Card-header').textContent).toContain(
      'header',
    );
  });

  it('passes a footer link', () => {
    const root = render({ footerLink: <a href="/somewhere">link</a> });
    const rootNode = findDOMNode(root);

    expect(rootNode.querySelector('.Card-footer-link').textContent).toContain(
      'link',
    );
  });

  it('passes footer text', () => {
    const root = render({ footerText: 'footer text' });
    const rootNode = findDOMNode(root);

    expect(rootNode.querySelector('.Card-footer-text').textContent).toContain(
      'footer text',
    );
  });

  it('passes children', () => {
    const root = render({ children: <div className="kids">hi</div> });
    const rootNode = findDOMNode(root);

    expect(rootNode.querySelector('.kids').textContent).toContain('hi');
  });
});
