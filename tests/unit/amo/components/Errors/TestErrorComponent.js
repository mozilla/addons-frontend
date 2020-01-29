import { shallow } from 'enzyme';
import * as React from 'react';
import NestedStatus from 'react-nested-status';

import Card from 'ui/components/Card';
import ErrorComponent from 'amo/components/Errors/ErrorComponent';

describe(__filename, () => {
  function render(props = {}) {
    return shallow(<ErrorComponent {...props} />);
  }

  it('renders an ErrorComponent', () => {
    const root = render();

    expect(root.find(NestedStatus)).toHaveProp('code', 400);
    expect(root.find(Card)).toHaveClassName('Errors');
  });

  it('renders header when header is available', () => {
    const header = 'foo';
    const root = render({ header });

    expect(root.find(Card)).toHaveProp('header', header);
  });

  it('renders code when code is supplied', () => {
    const code = 500;
    const root = render({ code });

    expect(root.find(NestedStatus)).toHaveProp('code', code);
  });

  it('renders children', () => {
    const children = 'hello';
    const root = render({ children });

    expect(root.find(Card).childAt(0).text()).toContain(children);
  });

  it('shows NotAuthorized class when error code is 401', () => {
    const root = render({ code: 401 });

    expect(root.find('.Errors')).toHaveClassName('NotAuthorized');
    expect(root.find('.Errors')).not.toHaveClassName('NotFound');
    expect(root.find('.Errors')).not.toHaveClassName('ServerError');
  });

  it('shows NotFound class when error code is 404', () => {
    const root = render({ code: 404 });

    expect(root.find('.Errors')).toHaveClassName('NotFound');
    expect(root.find('.Errors')).not.toHaveClassName('NotAuthorized');
    expect(root.find('.Errors')).not.toHaveClassName('ServerError');
  });

  it('shows ServerError class when error code is 500', () => {
    const root = render({ code: 500 });

    expect(root.find('.Errors')).toHaveClassName('ServerError');
    expect(root.find('.Errors')).not.toHaveClassName('NotFound');
    expect(root.find('.Errors')).not.toHaveClassName('NotAuthorized');
  });
});
