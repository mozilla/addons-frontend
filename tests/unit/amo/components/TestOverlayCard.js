import { shallow } from 'enzyme';
import * as React from 'react';

import Overlay from 'amo/components/Overlay';
import OverlayCard from 'amo/components/OverlayCard';
import { dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  const getProps = ({ ...props } = {}) => {
    return {
      className: 'OverlayCard',
      id: 'OverlayCard',
      store: dispatchClientMetadata().store,
      ...props,
    };
  };

  function render(props = {}) {
    return shallow(<OverlayCard {...getProps(props)} />);
  }

  it('passes onEscapeOverlay to Overlay', () => {
    const onEscapeOverlay = sinon.stub();
    const root = render({ onEscapeOverlay });

    expect(root.find(Overlay)).toHaveProp('onEscapeOverlay', onEscapeOverlay);
  });

  it('passes the header', () => {
    const root = render({ header: 'this is a header' });

    expect(root.find('.OverlayCard')).toHaveProp('header', 'this is a header');
  });

  it('passes a footer link', () => {
    const footerLink = <a href="/somewhere">link</a>;
    const root = render({ footerLink });

    expect(root.find('.OverlayCard')).toHaveProp('footerLink', footerLink);
  });

  it('passes footer text', () => {
    const footerText = 'footer text';
    const root = render({ footerText });

    expect(root.find('.OverlayCard')).toHaveProp('footerText', footerText);
  });

  it('passes children', () => {
    const root = render({ children: <div className="kids">hi</div> });

    expect(root.find('.OverlayCard').children()).toHaveText('hi');
  });
});
