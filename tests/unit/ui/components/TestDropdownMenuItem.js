import { shallow } from 'enzyme';
import React from 'react';

import DropdownMenuItem from 'ui/components/DropdownMenuItem';
import Link from 'amo/components/Link';

describe(__filename, () => {
  it('renders a section when only `children` prop is supplied', () => {
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
    expect(item).toHaveClassName('DropdownMenuItem-link');
    expect(item.find(Link)).toHaveLength(1);
    expect(item.find(Link)).toHaveProp('to', '/');
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
    expect(item).toHaveClassName('DropdownMenuItem-link');
    expect(item).toHaveClassName('DropdownMenuItem--detached');
  });

  it('renders a `button` when `onClick` prop is supplied', () => {
    const stub = sinon.stub();
    const item = shallow(
      <DropdownMenuItem onClick={stub}>
        A button
      </DropdownMenuItem>
    );

    expect(item).toHaveClassName('DropdownMenuItem');
    expect(item).toHaveClassName('DropdownMenuItem-link');
    expect(item.find('button')).toHaveLength(1);
    expect(item.find('button')).toHaveProp('onClick', stub);
  });

  it('can visually detach a button item', () => {
    const stub = sinon.stub();
    const item = shallow(
      <DropdownMenuItem onClick={stub} detached>
        A button that is detached from the rest of the menu
      </DropdownMenuItem>
    );

    expect(item).toHaveClassName('DropdownMenuItem');
    expect(item).toHaveClassName('DropdownMenuItem-link');
    expect(item).toHaveClassName('DropdownMenuItem--detached');
  });

  it('optionally takes a class name', () => {
    const item = shallow(
      <DropdownMenuItem className="custom-class">A section</DropdownMenuItem>
    );

    expect(item).toHaveClassName('DropdownMenuItem');
    expect(item).toHaveClassName('DropdownMenuItem-section');
    expect(item).toHaveClassName('custom-class');
  });
});
