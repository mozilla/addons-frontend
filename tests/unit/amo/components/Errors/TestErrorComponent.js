import { shallow } from 'enzyme';
import * as React from 'react';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';

describe(__filename, () => {
  function render(props = {}) {
    return shallow(<ErrorComponent {...props} />);
  }

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
