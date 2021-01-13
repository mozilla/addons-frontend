import { shallow } from 'enzyme';
import * as React from 'react';

import Badge from 'ui/components/Badge';
import Icon from 'ui/components/Icon';

describe(__filename, () => {
  it('renders a badge', () => {
    const badge = shallow(<Badge label="super badge" />);

    expect(badge).toHaveClassName('Badge');
    expect(badge.find(Icon)).toHaveLength(0);
    expect(badge.children()).toIncludeText('super badge');
  });

  it('can override the icon label', () => {
    const badge = shallow(<Badge type="experimental" label="foo" />);

    expect(badge.find(Icon)).toHaveProp('alt', 'foo');
  });

  it('displays the restart icon for type `restart-required`', () => {
    const badge = shallow(
      <Badge type="restart-required" label="restart required" />,
    );

    expect(badge).toHaveClassName('Badge');
    expect(badge).toHaveClassName('Badge-restart-required');
    expect(badge.find(Icon)).toHaveLength(1);
    expect(badge.find(Icon)).toHaveProp('alt', 'restart required');
    expect(badge.find(Icon)).toHaveProp('name', 'restart');
    expect(badge.text()).toContain('restart required');
  });

  it('displays the experimental badge icon for type `experimental`', () => {
    const badge = shallow(<Badge type="experimental" label="experimental" />);

    expect(badge).toHaveClassName('Badge');
    expect(badge).toHaveClassName('Badge-experimental');
    expect(badge.find(Icon)).toHaveLength(1);
    expect(badge.find(Icon)).toHaveProp('name', 'experimental-badge');
    expect(badge.text()).toContain('experimental');
  });

  it('displays the payment required badge icon for type `requires-payment`', () => {
    const badge = shallow(<Badge type="requires-payment" label="label text" />);

    expect(badge).toHaveClassName('Badge-requires-payment');
    expect(badge.find(Icon)).toHaveProp('name', 'requires-payment');
    expect(badge.text()).toContain('label text');
  });

  it('throws an error if invalid type is supplied', () => {
    expect(() => {
      shallow(<Badge type="invalid" label="foo" />);
    }).toThrowError(/Invalid badge type given: "invalid"/);
  });
});
