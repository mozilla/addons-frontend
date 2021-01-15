import * as React from 'react';
import { shallow } from 'enzyme';

import Icon from 'amo/components/Icon';
import Permission from 'amo/components/Permission';

describe(__filename, () => {
  const defaultProps = {
    type: 'my-type',
    description: 'A description',
  };

  function render(props = {}) {
    return shallow(<Permission {...defaultProps} {...props} />);
  }

  it('renders an li element', () => {
    const root = render();

    expect(root.find('li')).toHaveClassName(`Permission`);
  });

  it('renders an icon with custom name', () => {
    const type = 'testType';
    const root = render({ type });

    expect(root.find(Icon)).toHaveProp('name', `permission-${type}`);
  });

  it('replaces dots in icon name with dashes', () => {
    const root = render({ type: 'test.Type' });

    expect(root.find(Icon)).toHaveProp('name', 'permission-test-Type');
  });

  it('renders the description', () => {
    const description = 'It can access your bookmarks';
    const root = render({ description });

    expect(root.find('.Permission-description').text()).toEqual(description);
  });
});
