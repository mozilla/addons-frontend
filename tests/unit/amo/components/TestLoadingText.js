import * as React from 'react';

import LoadingText from 'amo/components/LoadingText';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => defaultRender(<LoadingText {...props} />);

  it('renders LoadingText element with className', () => {
    render();

    expect(screen.getByRole('alert')).toHaveClass('LoadingText');
  });

  it('lets you set a fixed width', () => {
    render({ width: 40 });

    expect(screen.getByRole('alert')).toHaveClass('LoadingText--width-40');
  });

  it('lets you set a custom class name', () => {
    const className = 'MyLoadingClass';
    render({ className });

    expect(screen.getByRole('alert')).toHaveClass(className);
  });
});
