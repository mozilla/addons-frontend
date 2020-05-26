import { shallow } from 'enzyme';
import * as React from 'react';
import NestedStatus from 'react-nested-status';

import Card from 'ui/components/Card';
import ErrorComponent from 'amo/components/Errors/ErrorComponent';

describe(__filename, () => {
  function render(props = {}) {
    return shallow(<ErrorComponent {...props} />);
  }

  it('renders an ErrorComponent when code, header and children is supplied', () => {
    const children = 'hello';
    const code = 500;
    const header = 'foo';

    const root = render({ children, code, header });

    expect(root.find(Card)).toHaveClassName('Errors');
    expect(root.find(Card)).toHaveProp('header', header);
    expect(root.find(Card).childAt(0).text()).toContain(children);
    expect(root.find(NestedStatus)).toHaveProp('code', code);
  });

  it('shows NotAuthorized class when error code is 401', () => {
    const root = render({
      header: 'foo',
      children: 'bar',
      code: 401,
    });

    expect(root.find('.Errors')).toHaveClassName('NotAuthorized');
    expect(root.find('.Errors')).not.toHaveClassName('NotFound');
    expect(root.find('.Errors')).not.toHaveClassName('ServerError');
  });

  it('shows NotFound class when error code is 404', () => {
    const root = render({
      header: 'foo',
      children: 'bar',
      code: 404,
    });

    expect(root.find('.Errors')).toHaveClassName('NotFound');
    expect(root.find('.Errors')).not.toHaveClassName('NotAuthorized');
    expect(root.find('.Errors')).not.toHaveClassName('ServerError');
  });

  it('shows ServerError class when error code is 500', () => {
    const root = render({
      header: 'foo',
      children: 'bar',
      code: 500,
    });

    expect(root.find('.Errors')).toHaveClassName('ServerError');
    expect(root.find('.Errors')).not.toHaveClassName('NotFound');
    expect(root.find('.Errors')).not.toHaveClassName('NotAuthorized');
  });
});
