import { shallow } from 'enzyme';
import * as React from 'react';

import Link from 'amo/components/Link';
import Button from 'ui/components/Button';
import { createFakeEvent } from 'tests/unit/helpers';

describe(__filename, () => {
  function render(props = {}) {
    return shallow(<Button {...props} />);
  }

  it('renders a button', () => {
    const onClick = sinon.spy();
    const button = render({
      children: 'My button!',
      className: 'Foo',
      onClick,
    });

    expect(button.type()).toEqual('button');
    expect(button).toHaveClassName('Button');
    expect(button).toHaveClassName('Foo');
    expect(button).toHaveProp('onClick', onClick);
    expect(button.children()).toIncludeText('My button!');
  });

  it('renders an in-app link with a to prop', () => {
    const href = '/profile/';
    const button = render({
      children: 'Link text!',
      className: 'Bar',
      to: href,
    });

    expect(button.type()).toEqual(Link);
    expect(button).toHaveClassName('Button');
    expect(button).toHaveClassName('Bar');
    expect(button).toHaveProp('to', href);
    expect(button.children()).toIncludeText('Link text!');
  });

  it('renders a link with a href', () => {
    const href = 'https://addons.mozilla.org';

    const button = render({
      children: 'Link text!',
      className: 'Bar',
      href,
    });

    expect(button.type()).toEqual(Link);
    expect(button).toHaveClassName('Button');
    expect(button).toHaveClassName('Bar');
    expect(button).toHaveProp('href', href);
    expect(button.children()).toIncludeText('Link text!');
    expect(button.find(Link)).toHaveProp('prependClientApp', false);
    expect(button.find(Link)).toHaveProp('prependLang', false);
  });

  it('can disable an anchor with a `href` prop', () => {
    const onClick = sinon.stub();
    const button = render({
      buttonType: 'action',
      children: 'Link text!',
      disabled: true,
      href: 'https://addons.mozilla.org',
      onClick,
    });

    const event = createFakeEvent();
    button.simulate('click', event);

    sinon.assert.notCalled(onClick);
    sinon.assert.called(event.preventDefault);
  });

  it('can disable an anchor with a `to` prop', () => {
    const onClick = sinon.stub();
    const button = render({
      buttonType: 'action',
      children: 'Link text!',
      disabled: true,
      onClick,
      to: '/addon/foo/',
    });

    const event = createFakeEvent();
    button.simulate('click', event);

    sinon.assert.notCalled(onClick);
    sinon.assert.called(event.preventDefault);
  });

  it('sets a disabled link class when disabled', () => {
    const button = render({
      buttonType: 'action',
      children: 'Link text!',
      className: 'CustomClass',
      disabled: true,
      href: 'https://addons.mozilla.org',
    });

    expect(button).toHaveClassName('Button--disabled');
    expect(button).toHaveClassName('CustomClass');
  });

  it('throws when an invalid type is supplied', () => {
    expect(() => {
      render({
        buttonType: 'not-a-real-type',
        children: 'Link text!',
        href: 'https://addons.mozilla.org',
      });
    }).toThrow(
      /buttonType="not-a-real-type" supplied but that is not a valid button/,
    );
  });

  it('renders a read only button', () => {
    const className = 'som-css-class';
    const button = render({ noLink: true, className });

    expect(button.type()).toEqual('span');
    expect(button).toHaveClassName(className);
  });

  it('renders a read only button with a title', () => {
    const title = 'some title';
    const button = render({ noLink: true, title });

    expect(button.type()).toEqual('span');
    expect(button).toHaveProp('title', title);
  });

  it('renders a link with a title', () => {
    const title = 'some title';
    const button = render({ href: '/', title });

    expect(button.type()).toEqual(Link);
    expect(button).toHaveProp('title', title);
  });

  it('renders a submit button with a title', () => {
    const title = 'some title';
    const button = render({ title });

    expect(button.type()).toEqual('button');
    expect(button).toHaveProp('title', title);
    expect(button).toHaveProp('type', 'submit');
  });

  it('renders a button with a different html type', () => {
    const htmlType = 'button';
    const button = render({ htmlType });

    expect(button).toHaveProp('type', htmlType);
  });
});
