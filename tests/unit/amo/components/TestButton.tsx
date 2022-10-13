import * as React from 'react';
import { createEvent, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Button from 'amo/components/Button';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  function render(props = {}) {
    return defaultRender(<Button {...props} />);
  }

  it('renders a button', async () => {
    const onClick = jest.fn();
    render({
      children: 'My button!',
      className: 'Foo',
      onClick,
    });
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('My button!');
    expect(button).toHaveClass('Foo');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });
  it('renders an in-app link with a to prop', () => {
    const href = '/profile/';
    render({
      children: 'Link text!',
      className: 'Bar',
      to: href,
    });
    const button = screen.getByRole('link');
    expect(button).toHaveTextContent('Link text!');
    expect(button).toHaveClass('Bar');
    expect(button).toHaveAttribute('href', `/en-US/android${href}`);
  });
  it('renders a link with a href', () => {
    const href = 'https://addons.mozilla.org';
    render({
      children: 'Link text!',
      className: 'Bar',
      href,
    });
    const button = screen.getByRole('link');
    expect(button).toHaveTextContent('Link text!');
    expect(button).toHaveClass('Bar');
    expect(button).toHaveAttribute('href', href);
  });
  it('can disable an anchor with a `href` prop', () => {
    const onClick = jest.fn();
    render({
      buttonType: 'action',
      children: 'Link text!',
      disabled: true,
      href: 'https://addons.mozilla.org',
      onClick,
    });
    const button = screen.getByRole('link');
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
    fireEvent(button, clickEvent);
    expect(onClick).not.toHaveBeenCalled();
    expect(preventDefaultWatcher).toHaveBeenCalled();
  });
  it('can disable an anchor with a `to` prop', () => {
    const onClick = jest.fn();
    render({
      buttonType: 'action',
      children: 'Link text!',
      disabled: true,
      onClick,
      to: '/addon/foo/',
    });
    const button = screen.getByRole('link');
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');
    fireEvent(button, clickEvent);
    expect(onClick).not.toHaveBeenCalled();
    expect(preventDefaultWatcher).toHaveBeenCalled();
  });
  it('sets a disabled link class when disabled', () => {
    render({
      buttonType: 'action',
      children: 'Link text!',
      className: 'CustomClass',
      disabled: true,
      href: 'https://addons.mozilla.org',
    });
    const button = screen.getByRole('link');
    expect(button).toHaveClass('Button--disabled');
    expect(button).toHaveClass('CustomClass');
  });
  it('throws when an invalid type is supplied', () => {
    expect(() => {
      render({
        buttonType: 'not-a-real-type',
        children: 'Link text!',
        href: 'https://addons.mozilla.org',
      });
    }).toThrow(/buttonType="not-a-real-type" supplied but that is not a valid button/);
  });
  it('renders a read only button', () => {
    const className = 'some-css-class';
    render({
      noLink: true,
      className,
    });
    expect(screen.getByTagName('span')).toHaveClass(className);
  });
  it('renders a read only button with a title', () => {
    const title = 'some title';
    render({
      noLink: true,
      title,
    });
    expect(screen.getByTitle(title)).toBeInTheDocument();
  });
  it('renders a link with a title', () => {
    const title = 'some title';
    render({
      href: '/',
      title,
    });
    expect(screen.getByRole('link', {
      title,
    })).toBeInTheDocument();
  });
  it('renders a submit button with a title', () => {
    const title = 'some title';
    render({
      title,
    });
    expect(screen.getByRole('button', {
      title,
    })).toHaveAttribute('type', 'submit');
  });
  it('renders a button with a different html type', () => {
    const htmlType = 'button';
    render({
      htmlType,
    });
    expect(screen.getByRole('button')).toHaveAttribute('type', htmlType);
  });
});