import { shallow } from 'enzyme';
import React from 'react';

import Link from 'amo/components/Link';
import Button from 'ui/components/Button';


describe('<Button />', () => {
  it('renders a button', () => {
    const onClick = sinon.spy();
    const button = shallow(
      <Button className="Foo" onClick={onClick}>My button!</Button>);

    expect(button.type()).toEqual('button');
    expect(button).toHaveClassName('Button');
    expect(button).toHaveClassName('Foo');
    expect(button).toHaveProp('onClick', onClick);
    expect(button.children()).toIncludeText('My button!');
  });

  it('renders a link with an href', () => {
    const href = 'https://addons.mozilla.org';
    const button = shallow(
      <Button className="Bar" to={href}>Link text!</Button>);

    expect(button.type()).toEqual(Link);
    expect(button).toHaveClassName('Button');
    expect(button).toHaveClassName('Bar');
    expect(button).toHaveProp('to', href);
    expect(button.children()).toIncludeText('Link text!');
  });
});
