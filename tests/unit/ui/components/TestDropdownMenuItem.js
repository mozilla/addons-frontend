import { shallow } from 'enzyme';
import React from 'react';

import DropdownMenuItem from 'ui/components/DropdownMenuItem';
import Link from 'amo/components/Link';


describe(__filename, () => {
  it('renders a section when only `title` is specified', () => {
    const item = shallow(
      <DropdownMenuItem>A section</DropdownMenuItem>
    );

    expect(item).toHaveClassName('DropdownMenuItem');
    expect(item).toHaveClassName('DropdownMenuItem-section');
    expect(item).toIncludeText('A section');
  });

  it('renders a `Link` passed in children', () => {
    const item = shallow(
      <DropdownMenuItem>
        <Link to="/">a link</Link>
      </DropdownMenuItem>
    );

    expect(item).toHaveClassName('DropdownMenuItem');
    expect(item.find(Link)).toHaveLength(1);
    expect(item.find(Link)).toHaveProp('to', '/');
    // This assertion makes sure the given `Link` is cloned with the right
    // `className` prop.
    expect(item.find(Link)).toHaveClassName('DropdownMenuItem-link');
  });

  it('can visually detach a link item', () => {
    const item = shallow(
      <DropdownMenuItem detached>
        <Link to="/">
          a link detached from the rest of the menu
        </Link>
      </DropdownMenuItem>
    );

    expect(item).toHaveClassName('DropdownMenuItem');
    expect(item.find(Link)).toHaveLength(1);
    expect(item.find(Link)).toHaveClassName('DropdownMenuItem-link');
    expect(item.find(Link)).toHaveClassName('DropdownMenuItem-link--detached');
  });

  it('renders a `button` when `onClick` prop is supplied', () => {
    const stub = sinon.stub();
    const item = shallow(
      <DropdownMenuItem onClick={stub}>
        A button
      </DropdownMenuItem>
    );

    expect(item).toHaveClassName('DropdownMenuItem');
    expect(item.find('button')).toHaveLength(1);
    expect(item.find('button')).toHaveClassName('DropdownMenuItem-link');
    expect(item.find('button')).toHaveProp('onClick', stub);
  });

  it('can visually detach a button item', () => {
    const stub = sinon.stub();
    const button = shallow(
      <DropdownMenuItem onClick={stub} detached>
        A button that is detached from the rest of the menu
      </DropdownMenuItem>
    ).find('button');

    expect(button).toHaveLength(1);
    expect(button).toHaveClassName('DropdownMenuItem-link');
    expect(button).toHaveClassName('DropdownMenuItem-link--detached');
  });

  it('throws an error if child component is not a `Link`', () => {
    expect(() => {
      shallow(
        <DropdownMenuItem>
          <input />
        </DropdownMenuItem>
      );
    }).toThrowError(/Only the "Link" component is supported as a child/);
  });
});
