import * as React from 'react';
import { Provider } from 'react-redux';
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
        <Provider store={props.store}>
          <DismissibleTextForm {...props} />
        </Provider>
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
      root.find('textarea.DismissibleTextForm-textarea')
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

  it('calls back when submitting the form', () => {
    const onSubmit = sinon.stub();
    const root = shallowRender({ onSubmit });
    const enteredText = 'Some review text';

    typeSomeText({ root, text: enteredText });

    // Submit the form.
    const event = createFakeEvent();
    root.find('.DismissibleTextForm-submit').simulate('click', event);

    sinon.assert.calledWith(onSubmit, {
      event, text: enteredText,
    });
  });

  it('lets you configure the submit button text', () => {
    const root = shallowRender({
      submitButtonText: 'Submit the form',
    });

    expect(root.find('.DismissibleTextForm-submit').childAt(0))
      .toHaveText('Submit the form');
  });

  it('lets you configure the in-progress submit button text', () => {
    const root = shallowRender({
      submitButtonInProgressText: 'Submitting the form',
      isSubmitting: true,
    });

    expect(root.find('.DismissibleTextForm-submit').childAt(0))
      .toHaveText('Submitting the form');
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

  it('disables submit button before non-empty text has been entered', () => {
    // Enter only white space:
    const root = shallowRender({ text: '    ' });

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
