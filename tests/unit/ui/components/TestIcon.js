import * as React from 'react';
import { shallow } from 'enzyme';

import Icon from 'ui/components/Icon';


describe('<Icon />', () => {
  it('maps the name to a className', () => {
    const root = shallow(<Icon name="foo" />);

    expect(root).toHaveClassName('Icon');
    expect(root).toHaveClassName('Icon-foo');
  });

  it('allows a custom className', () => {
    const root = shallow(<Icon name="bar" className="sup" />);

    expect(root).toHaveClassName('Icon');
    expect(root).toHaveClassName('Icon-bar');
    expect(root).toHaveClassName('sup');
  });

  it('renders alt-text as a visually hidden span', () => {
    const root = shallow(<Icon alt="Alt text!" name="bar" />);

    expect(root.children()).toHaveHTML(
      '<span class="visually-hidden">Alt text!</span>'
    );
  });
});
