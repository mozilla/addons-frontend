import * as React from 'react';

import IconXMark from 'amo/components/IconXMark';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    return defaultRender(<IconXMark {...props} />);
  };

  it('renders a custom class name', () => {
    const className = 'MyClass';
    const { root } = render({ className });

    expect(root).toHaveClass('IconXMark');
    expect(root).toHaveClass(className);
  });

  it('can pass an alt to Icon', () => {
    const alt = 'click to close';
    render({ alt });
    screen.debug();

    expect(screen.getByText(alt)).toBeInTheDocument();
  });

  it('provides a class name for styling the SVG path', () => {
    render();

    expect(screen.getByTagName('g')).toHaveClass('IconXMark-path');
  });
});
