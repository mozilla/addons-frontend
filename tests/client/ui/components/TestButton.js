import React from 'react';

import Link from 'amo/components/Link';
import { shallowRender } from 'tests/client/helpers';
import Button from 'ui/components/Button';

describe('<Button />', () => {
  it('renders a button', () => {
    const onClick = sinon.spy();
    const button = shallowRender(<Button className="Foo" onClick={onClick}>My button!</Button>);
    expect(button.type).toEqual('button');
    expect(button.props.className).toEqual('Button Foo');
    expect(button.props.onClick).toBe(onClick);
    expect(button.props.children).toEqual('My button!');
  });

  it('renders a link with an href', () => {
    const href = 'https://addons.mozilla.org';
    const button = shallowRender(<Button className="Bar" to={href}>Link text!</Button>);
    expect(button.type).toEqual(Link);
    expect(button.props.className).toEqual('Button Bar');
    expect(button.props.to).toBe(href);
    expect(button.props.children).toEqual('Link text!');
  });
});
