import React from 'react';
import { shallowRender } from 'tests/client/helpers';
import { Link } from 'react-router';

import { NavBar, NavBarItem, NavBarLink } from 'core/components/NavBar';

describe('<NavBarItem />', () => {
  it('wraps its children in a span', () => {
    const root = shallowRender(<NavBarItem>Foo</NavBarItem>);
    assert.equal(root.props.className, 'NavBarItem');
    assert.equal(root.type, 'span');
    assert.equal(root.props.children, 'Foo');
  });
});

describe('<NavBarLink />', () => {
  it('wraps its children in a span', () => {
    const root = shallowRender(<NavBarLink to="/bar">Baileys Taproom</NavBarLink>);
    assert.equal(root.type, NavBarItem);
    assert.equal(root.props.children.type, Link);
    assert.equal(root.props.children.props.to, '/bar');
    assert.equal(root.props.children.props.children, 'Baileys Taproom');
  });
});

describe('<NavBar />', () => {
  it('wraps its children in a div', () => {
    const root = shallowRender(<NavBar>Navigate places!</NavBar>);
    assert.equal(root.type, 'div');
    assert.equal(root.props.className, 'NavBar');
    assert.equal(root.props.children, 'Navigate places!');
  });
});
