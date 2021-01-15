import * as React from 'react';
import { shallow } from 'enzyme';

import Icon from 'amo/components/Icon';
import IconXMark from 'amo/components/IconXMark';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallow(<IconXMark {...props} />);
  };

  it('renders a custom class name', () => {
    const className = 'MyClass';
    const root = render({ className });

    expect(root).toHaveClassName('IconXMark');
    expect(root).toHaveClassName(className);
  });

  it('passes other props to Icon', () => {
    const alt = 'click to close';
    const root = render({ alt });

    expect(root.find(Icon)).toHaveProp('alt', alt);
  });

  it('provides a class name for styling the SVG path', () => {
    const root = render();

    expect(root.find('.IconXMark-path')).toHaveLength(1);
  });
});
