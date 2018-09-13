import * as React from 'react';
import { shallow } from 'enzyme';

import ShowMoreCard, {
  extractId,
  ShowMoreCardBase,
  MAX_HEIGHT,
} from 'ui/components/ShowMoreCard';
import {
  applyUIStateChanges,
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const getProps = ({ i18n = fakeI18n(), ...props } = {}) => {
    return {
      i18n,
      id: 'showMoreCard',
      store: dispatchClientMetadata().store,
      ...props,
    };
  };

  function render({ children, ...otherProps } = {}) {
    const props = getProps(otherProps);
    return shallowUntilTarget(
      <ShowMoreCard {...props}>{children || 'some info'}</ShowMoreCard>,
      ShowMoreCardBase,
    );
  }

  it('reveals more text when clicking "read more" link', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    // We are simulating the truncate method call.
    root.instance().truncateToMaxHeight({ clientHeight: MAX_HEIGHT + 1 });

    applyUIStateChanges({ root, store });

    expect(root).toHaveProp('footerLink');
    const footerLink = root.prop('footerLink');
    const cardLink = shallow(footerLink);
    const moreLink = cardLink.find('.ShowMoreCard-expand-link');

    moreLink.simulate('click', createFakeEvent());

    applyUIStateChanges({ root, store });

    expect(root).toHaveProp('footerLink', null);

    expect(root).toHaveClassName('ShowMoreCard--expanded');
  });

  it('is expanded by default', () => {
    const root = render();

    expect(root).toHaveClassName('ShowMoreCard--expanded');
  });

  it('truncates the contents if they are too long', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    // We are simulating the truncate method call.
    root.instance().truncateToMaxHeight({ clientHeight: MAX_HEIGHT + 1 });

    applyUIStateChanges({ root, store });

    expect(root).not.toHaveClassName('ShowMoreCard--expanded');
  });

  it('renders className', () => {
    const className = 'test';
    const root = render({ className });
    expect(root).toHaveClassName(className);
  });

  it('renders children', () => {
    const root = render({ children: 'Hello I am description' });
    const contents = root.find('.ShowMoreCard-contents');
    expect(contents).toHaveText('Hello I am description');
  });

  it("dispatches if the children's html has changed", () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    /* eslint-disable react/no-danger */
    const root = render({
      store,
      children: (
        <div
          dangerouslySetInnerHTML={{
            __html: '<span>First component text.</span>',
          }}
        />
      ),
    });

    root.setProps({
      children: (
        <div
          dangerouslySetInnerHTML={{
            __html: '<span>This is different Text.</span>',
          }}
        />
      ),
    });
    /* eslint-enable react/no-danger */

    sinon.assert.called(dispatchSpy);
  });

  it("dispatches if the children's text has changed", () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({
      store,
      children: 'Some text',
    });

    root.setProps({
      children: 'Some new text',
    });

    sinon.assert.called(dispatchSpy);
  });

  it("does not dispatch if the children's html is the same", () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    /* eslint-disable react/no-danger */
    const root = render({
      store,
      children: (
        <div
          dangerouslySetInnerHTML={{
            __html: '<span>Some component text.</span>',
          }}
        />
      ),
    });

    root.setProps({
      children: (
        <div
          dangerouslySetInnerHTML={{
            __html: '<span>Some component text.</span>',
          }}
        />
      ),
    });
    /* eslint-enable react/no-danger */

    sinon.assert.notCalled(dispatchSpy);
  });

  it("does not dispatch if the children's text is the same", () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({
      store,
      children: 'Some text',
    });

    root.setProps({
      children: 'Some text',
    });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('executes truncateToMaxHeight when it receives props', () => {
    const root = render();

    const contentNode = root.instance().contents;

    const truncateToMaxHeight = sinon.spy(
      root.instance(),
      'truncateToMaxHeight',
    );

    // We are simulating any kind of update to properties.
    root.setProps();

    sinon.assert.calledWith(truncateToMaxHeight, contentNode);
  });

  it('does not execute truncateToMaxHeight when "read more" has been expanded', () => {
    const { store } = dispatchClientMetadata();

    // Simulating read more has been expanded already.
    const root = render({
      store: {
        ...store,
        store: {
          uiState: {
            readMoreExpanded: true,
          },
        },
      },
    });

    const truncateSpy = sinon.spy(root.instance(), 'truncateToMaxHeight');

    sinon.assert.notCalled(truncateSpy);
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the ID prop', () => {
      const id = 'custom-card-id';
      expect(extractId(getProps({ id }))).toEqual(id);
    });
  });
});
