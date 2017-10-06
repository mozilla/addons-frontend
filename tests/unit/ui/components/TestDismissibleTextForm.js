import React from 'react';
import { mount } from 'enzyme';

import I18nProvider from 'core/i18n/Provider';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFakeEvent, fakeI18n, shallowUntilTarget,
} from 'tests/unit/helpers';
import DismissibleTextForm, {
  DismissibleTextFormBase,
} from 'ui/components/DismissibleTextForm';

describe(__filename, () => {
  let store;

  const renderProps = (customProps = {}) => {
    return {
      i18n: fakeI18n(),
      onDismiss: sinon.stub(),
      onSubmit: sinon.stub(),
      store,
      ...customProps,
    };
  };

  const shallowRender = (customProps = {}) => {
    const props = renderProps(customProps);
    return shallowUntilTarget(
      <DismissibleTextForm {...props} />,
      DismissibleTextFormBase
    );
  };

  const mountRender = (customProps = {}) => {
    const props = renderProps(customProps);
    return mount(
      <I18nProvider i18n={props.i18n}>
        <DismissibleTextForm {...props} />
      </I18nProvider>
    );
  };

  const typeSomeText = ({ root, text }) => {
    // Simulate typing in a textarea.
    root.find('.DismissibleTextForm-textarea')
      .simulate('change', createFakeEvent({
        target: { value: text },
      }));
  };

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  it('can be configured with a custom class', () => {
    const root = shallowRender({ className: 'some-class' });

    expect(root).toHaveClassName('some-class');
  });

  it('lets you configure the submit button class', () => {
    const root = shallowRender({ submitButtonClassName: 'my-class' });

    expect(root.find('.DismissibleTextForm-submit'))
      .toHaveClassName('my-class');
  });

  it('renders a placeholder', () => {
    const root = shallowRender({
      placeholder: 'Enter some text',
    });

    expect(root.find('.DismissibleTextForm-textarea'))
      .toHaveProp('placeholder', 'Enter some text');
  });

  it('lets you render text', () => {
    const root = shallowRender({
      text: 'Some text to edit',
    });

    expect(root.find('.DismissibleTextForm-textarea'))
      .toHaveProp('defaultValue', 'Some text to edit');
  });

  it('focuses the textarea on mount', () => {
    const root = mountRender();
    // This checks that textarea.focus() was called.
    expect(
      root.find('.DismissibleTextForm-textarea')
        .matchesElement(document.activeElement)
    ).toEqual(true);
  });

  it('calls back when dismissing the textarea', () => {
    const onDismiss = sinon.stub();
    const root = shallowRender({
      onDismiss,
    });

    root.find('.DismissibleTextForm-dismiss')
      .simulate('click', createFakeEvent());

    sinon.assert.called(onDismiss);
  });

  it('clears the text when dismissing a textarea', () => {
    const root = shallowRender();

    typeSomeText({ root, text: 'Some review text' });

    // Click the cancel button.
    root.find('.DismissibleTextForm-dismiss')
      .simulate('click', createFakeEvent());

    // Make sure the default textarea value was cleared.
    expect(root.find('.DismissibleTextForm-textarea'))
      .toHaveProp('defaultValue', '');
  });

  it('calls back when submitting the form', () => {
    const onSubmit = sinon.stub();
    const root = shallowRender({ onSubmit });
    const enteredText = 'Some review text';

    typeSomeText({ root, text: enteredText });

    // Submit the form.
    const submitEvent = createFakeEvent();
    root.find('.DismissibleTextForm-form')
      .simulate('submit', submitEvent);

    sinon.assert.calledWith(onSubmit, {
      event: submitEvent,
      text: enteredText,
    });
  });

  it('lets you configure the submit button text', () => {
    const root = shallowRender({
      submitButtonText: 'Submit the form',
    });

    expect(root.find('.DismissibleTextForm-submit').childAt(0))
      .toContain('Submit the form');
  });

  it('lets you configure the in-progress submit button text', () => {
    const root = shallowRender({
      submitButtonInProgressText: 'Submitting the form',
      isSubmitting: true,
    });

    expect(root.find('.DismissibleTextForm-submit').childAt(0))
      .toContain('Submitting the form');
  });

  it('disables the submit button while submitting the form', () => {
    const root = shallowRender({ isSubmitting: true, text: 'Some text' });

    expect(root.find('.DismissibleTextForm-submit'))
      .toHaveProp('disabled', true);
  });

  it('disables the submit button before text has been entered', () => {
    const root = shallowRender({ text: '' });

    expect(root.find('.DismissibleTextForm-submit'))
      .toHaveProp('disabled', true);
  });

  it('disables the dismiss button while submitting the form', () => {
    const root = shallowRender({ isSubmitting: true });

    expect(root.find('.DismissibleTextForm-dismiss'))
      .toHaveProp('disabled', true);
  });

  it('enables the dismiss button while not submitting the form', () => {
    const root = shallowRender({ isSubmitting: false });

    expect(root.find('.DismissibleTextForm-dismiss'))
      .toHaveProp('disabled', false);
  });

  it('enables the submit button after text has been entered', () => {
    const root = shallowRender({ text: '' });

    typeSomeText({ root, text: 'Typing some text...' });

    expect(root.find('.DismissibleTextForm-submit'))
      .toHaveProp('disabled', false);
  });

  it('disables the textarea when submitting the form', () => {
    const root = shallowRender({ isSubmitting: true });

    expect(root.find('.DismissibleTextForm-textarea'))
      .toHaveProp('disabled', true);
  });

  it('enables the textarea when not submitting the form', () => {
    const root = shallowRender({ isSubmitting: false });

    expect(root.find('.DismissibleTextForm-textarea'))
      .toHaveProp('disabled', false);
  });
});
