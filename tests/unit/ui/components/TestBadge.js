import { shallow } from 'enzyme';
import React from 'react';

import Badge from 'ui/components/Badge';
import Icon from 'ui/components/Icon';


describe(__filename, () => {
  it('renders a badge', () => {
    const badge = shallow(<Badge label="super badge" />);

    expect(badge).toHaveClassName('Badge');
    expect(badge.find(Icon)).toHaveLength(0);
    expect(badge.children()).toIncludeText('super badge');
  });

  it('optionally has a type', () => {
    const badge = shallow(<Badge type="featured" label="foo" />);

    expect(badge).toHaveClassName('Badge');
    expect(badge).toHaveClassName('Badge-featured');
    expect(badge.find(Icon)).toHaveLength(1);
    expect(badge.find(Icon)).toHaveProp('alt', 'foo');
    expect(badge.find(Icon)).toHaveProp('name', 'featured');
    expect(badge.text()).toContain('foo');
  });

  it('displays the restart icon for type `restart-required`', () => {
    const badge = shallow(<Badge type="restart-required" label="restart required" />);

    expect(badge).toHaveClassName('Badge');
    expect(badge).toHaveClassName('Badge-restart-required');
    expect(badge.find(Icon)).toHaveLength(1);
    expect(badge.find(Icon)).toHaveProp('alt', 'restart required');
    expect(badge.find(Icon)).toHaveProp('name', 'restart');
    expect(badge.text()).toContain('restart required');
  });

  it('throws an error if invalid type is supplied', () => {
    expect(() => {
      shallow(<Badge type="invalid" label="foo" />);
    }).toThrowError(/Invalid badge type given: "invalid"/);
  });
});
