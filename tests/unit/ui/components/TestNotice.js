import { shallow } from 'enzyme';
import * as React from 'react';

import { createFakeEvent, shallowUntilTarget } from 'tests/unit/helpers';
import Notice, { NoticeBase } from 'ui/components/Notice';

const render = ({ children, ...customProps } = {}) => {
  const props = { type: 'success', ...customProps };
  return shallowUntilTarget(<Notice {...props}>{children}</Notice>, NoticeBase);
};

describe(__filename, () => {
  it('renders a custom class name', () => {
    const root = render({ className: 'some-class' });

    expect(root).toHaveClassName('some-class');
    expect(root).toHaveClassName('Notice');
  });

  it('renders a class for the type', () => {
    const root = render({ type: 'error' });

    expect(root).toHaveClassName('Notice-error');
  });

  it('renders children', () => {
    const root = render({ children: <em>Some text</em> });

    expect(root.find('em')).toHaveLength(1);
    expect(root.text()).toEqual('Some text');
  });

  it('requires a known type', () => {
    expect(() => render({ type: 'nope' })).toThrow(/Unknown type: nope/);
  });

  it('hides action buttons by default', () => {
    const root = render();

    expect(root.find('.Notice-button')).toHaveLength(0);
  });

  it('renders an action button', () => {
    const actionOnClick = sinon.stub();
    const root = render({ actionOnClick, actionText: 'some text' });

    const button = root.find('.Notice-button');
    expect(button).toHaveLength(1);
    expect(button.html()).toContain('some text');

    button.simulate('click', createFakeEvent());
    sinon.assert.called(actionOnClick);
  });

  it('requires actionText when specifying a button action', () => {
    expect(() => render({ actionOnClick: sinon.stub() })).toThrow(
      /actionText is required/,
    );
  });

  it('renders a button with a `to` property', () => {
    const actionTo = '/some-relative-link';
    const root = render({ actionTo, actionText: 'a button link' });

    const button = root.find('.Notice-button');
    expect(button).toHaveProp('to', actionTo);
  });

  it('renders a button with an `href` property', () => {
    const actionHref = 'https://example.com';
    const root = render({ actionHref, actionText: 'a button link' });

    const button = root.find('.Notice-button');
    expect(button).toHaveProp('href', actionHref);
  });
});
