import * as React from 'react';

import Select from 'amo/components/Select';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  function render(props = {}) {
    return defaultRender(<Select {...props} />);
  }

  it('renders a custom class name', () => {
    const className = 'MyClass';
    render({ className });

    const select = screen.getByRole('combobox');

    expect(select).toHaveClass(className);
    expect(select).toHaveClass('Select');
  });

  it('renders children', () => {
    const optionText = 'some option';
    render({ children: <option>{optionText}</option> });

    expect(screen.getByRole('option')).toHaveTextContent(optionText);
  });

  it('passes custom props to select', () => {
    render({ disabled: true });

    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
