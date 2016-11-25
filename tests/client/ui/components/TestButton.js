import React from 'react';
import { Link } from 'react-router';

import { shallowRender } from 'tests/client/helpers';
import Button from 'ui/components/Button';

describe('<Button />', () => {
  it('renders a button', () => {
    const onClick = sinon.spy();
    const button = shallowRender(<Button className="Foo" onClick={onClick}>My button!</Button>);
    assert.equal(button.type, 'button');
    assert.equal(button.props.className, 'Button Foo');
    assert.strictEqual(button.props.onClick, onClick);
    assert.equal(button.props.children, 'My button!');
  });

  it('renders a link with an href', () => {
    const href = 'https://addons.mozilla.org';
    const button = shallowRender(<Button className="Bar" href={href}>Link text!</Button>);
    assert.equal(button.type, Link);
    assert.equal(button.props.className, 'Button Bar');
    assert.strictEqual(button.props.href, href);
    assert.equal(button.props.children, 'Link text!');
  });
});
