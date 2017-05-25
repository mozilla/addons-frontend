import React from 'react';
import { Link } from 'react-router';

import { shallowRender } from 'tests/client/helpers';
import { NavBar, NavBarButton, NavBarItem, NavBarLink } from 'core/components/NavBar';

describe('<NavBarItem />', () => {
  it('wraps its children in a span', () => {
    const root = shallowRender(<NavBarItem>Foo</NavBarItem>);
    expect(root.props.className).toEqual('NavBarItem');
    expect(root.type).toEqual('span');
    expect(root.props.children).toEqual('Foo');
  });
});

describe('<NavBarLink />', () => {
  it('wraps its children in a span', () => {
    const root = shallowRender(<NavBarLink to="/bar">Baileys Taproom</NavBarLink>);
    expect(root.type).toEqual(NavBarItem);
    expect(root.props.children.type).toEqual(Link);
    expect(root.props.children.props.to).toEqual('/bar');
    expect(root.props.children.props.children).toEqual('Baileys Taproom');
  });
});

describe('<NavBar />', () => {
  it('wraps its children in a div', () => {
    const root = shallowRender(<NavBar>Navigate places!</NavBar>);
    expect(root.type).toEqual('div');
    expect(root.props.className).toEqual('NavBar');
    expect(root.props.children).toEqual('Navigate places!');
  });
});

describe('<NavBarButton />', () => {
  it('wraps a button in an item', () => {
    const onClick = sinon.spy();
    const root = shallowRender(<NavBarButton onClick={onClick}>Button!</NavBarButton>);
    expect(root.type).toEqual(NavBarItem);
    const button = root.props.children;
    expect(button.type).toEqual('button');
    expect(button.props.className).toEqual('NavBarButton');
    expect(button.props.onClick).toBe(onClick);
    expect(button.props.children).toEqual('Button!');
  });
});
