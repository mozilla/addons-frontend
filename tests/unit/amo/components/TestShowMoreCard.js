import * as React from 'react';
import { shallow } from 'enzyme';

import ShowMoreCard, {
  extractId,
  ShowMoreCardBase,
  DEFAULT_MAX_HEIGHT,
} from 'amo/components/ShowMoreCard';
import {
  applyUIStateChanges,
  createFakeEvent,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const getProps = ({ i18n = fakeI18n(), ...props } = {}) => {
    return {
      contentId: 123,
      i18n,
      id: 'showMoreCard',
      store: dispatchClientMetadata().store,
      ...props,
    };
  };

  function render({
    children = 'some text',
    shallowOptions,
    ...otherProps
  } = {}) {
    const props = getProps(otherProps);
    return shallowUntilTarget(
      <ShowMoreCard {...props}>{children}</ShowMoreCard>,
      ShowMoreCardBase,
      { shallowOptions },
    );
  }

  it('reveals more text when clicking "read more" link', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    // We are simulating the truncate method call.
    root
      .instance()
      .truncateToMaxHeight({ clientHeight: DEFAULT_MAX_HEIGHT + 1 });

    applyUIStateChanges({ root, store });

    expect(root).toHaveProp('footerLink');
    const footerLink = root.prop('footerLink');
    const moreLink = shallow(footerLink).find('.ShowMoreCard-expand-link');

    moreLink.simulate('click', createFakeEvent());

    applyUIStateChanges({ root, store });

    expect(root).toHaveProp('footerLink', null);

    expect(root).toHaveClassName('ShowMoreCard--expanded');
  });

  it('is expanded by default if content is not too long', () => {
    const root = render();

    expect(root).toHaveClassName('ShowMoreCard--expanded');
  });

  it('is truncated by default if content is too long', () => {
    const { store } = dispatchClientMetadata();

    const root = render({
      store,
      shallowOptions: { disableLifecycleMethods: true },
    });

    root.instance().contents = { clientHeight: DEFAULT_MAX_HEIGHT + 1 };

    root.instance().componentDidMount();

    applyUIStateChanges({ root, store });

    expect(root).not.toHaveClassName('ShowMoreCard--expanded');
  });

  it('does not dispatch any setUIState if the content height is smaller than the maxHeight prop', () => {
    const { store } = dispatchClientMetadata();

    const root = render({
      store,
      shallowOptions: { disableLifecycleMethods: true },
      maxHeight: DEFAULT_MAX_HEIGHT + 10,
    });

    root.instance().contents = { clientHeight: DEFAULT_MAX_HEIGHT + 1 };

    root.instance().componentDidMount();

    expect(() => applyUIStateChanges({ root, store })).toThrowError(
      /not dispatched any setUIState/,
    );
  });

  it('truncates the contents if they are too long', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    // We are simulating the truncate method call.
    root
      .instance()
      .truncateToMaxHeight({ clientHeight: DEFAULT_MAX_HEIGHT + 1 });

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

  it('calls resetUIState if the contentId has changed', () => {
    const root = render({ contentId: 1 });

    const resetUIStateSpy = sinon.spy(root.instance(), 'resetUIState');

    root.setProps({ contentId: 2 });

    sinon.assert.called(resetUIStateSpy);
  });

  it('does not call resetUIState if the contentId is the same', () => {
    const root = render({ contentId: 1 });

    const resetUIStateSpy = sinon.spy(root.instance(), 'resetUIState');

    root.setProps({ contentId: 1 });

    sinon.assert.notCalled(resetUIStateSpy);
  });

  it('executes truncateToMaxHeight when it receives props changes', () => {
    const root = render();

    const contentNode = root.instance().contents;

    const truncateToMaxHeight = sinon.spy(
      root.instance(),
      'truncateToMaxHeight',
    );

    // We are simulating any kind of update to properties.
    root.setProps({ children: 'Some text' });

    sinon.assert.calledWith(truncateToMaxHeight, contentNode);
  });

  it('does not execute truncateToMaxHeight when "read more" has been expanded', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    // We are simulating the truncate method call.
    root
      .instance()
      .truncateToMaxHeight({ clientHeight: DEFAULT_MAX_HEIGHT + 1 });

    applyUIStateChanges({ root, store });

    const footerLink = root.prop('footerLink');
    const moreLink = shallow(footerLink).find('.ShowMoreCard-expand-link');

    // Simulates clicking on "read more".
    moreLink.simulate('click', createFakeEvent());

    applyUIStateChanges({ root, store });

    const truncateSpy = sinon.spy(root.instance(), 'truncateToMaxHeight');

    root.setProps({ children: 'some text' });

    sinon.assert.notCalled(truncateSpy);
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the ID prop', () => {
      const id = 'custom-card-id';
      expect(extractId(getProps({ id }))).toEqual(id);
    });
  });
});
