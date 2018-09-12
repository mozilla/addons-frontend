import { shallow } from 'enzyme';
import * as React from 'react';

import RatingManagerNotice from 'amo/components/RatingManagerNotice';
import Notice, { successType } from 'ui/components/Notice';

describe(__filename, () => {
  function render(customProps = {}) {
    const props = {
      hideMessage: false,
      message: 'a message',
      type: successType,
      ...customProps,
    };

    return shallow(<RatingManagerNotice {...props} />);
  }

  it('renders a Notice for a type', () => {
    const message = 'test message';
    const type = successType;

    const root = render({ message, type });

    expect(root.type()).toEqual(Notice);
    expect(root).toHaveProp('type', type);
    expect(root.children()).toHaveText(message);
  });

  it('renders a span if there is no type', () => {
    const message = 'test message';
    const type = undefined;

    const root = render({ message, type });

    expect(root.type()).toEqual('span');
    expect(root).not.toHaveProp('type');
    expect(root.children()).toHaveText(message);
  });

  it('can show a notice', () => {
    const root = render({ hideMessage: false });

    expect(root).not.toHaveClassName('RatingManagerNotice-savedRating-hidden');
  });

  it('can hide a notice', () => {
    const root = render({ hideMessage: true });

    expect(root).toHaveClassName('RatingManagerNotice-savedRating-hidden');
  });

  it('can have a custom className', () => {
    const className = 'some-class-name';
    const root = render({ className });

    expect(root).toHaveClassName('RatingManagerNotice-savedRating');
    expect(root).toHaveClassName(className);
  });
});
