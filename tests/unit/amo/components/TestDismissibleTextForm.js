import * as React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';

import I18nProvider from 'amo/i18n/Provider';
import {
  createFakeDebounce,
  createFakeEvent,
  createFakeLocalState,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import DismissibleTextForm, {
  DismissibleTextFormBase,
} from 'ui/components/DismissibleTextForm';

describe(__filename, () => {
  let store;

  const renderProps = (customProps = {}) => {
    return {
      _createLocalState: createFakeLocalState,
      _debounce: createFakeDebounce(),
      i18n: fakeI18n(),
      id: 'any-form-id',
      onDelete: null,
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
      DismissibleTextFormBase,
    );
  };

  const mountRender = (customProps = {}) => {
    const props = renderProps(customProps);
    return mount(
      <I18nProvider i18n={props.i18n}>
        <Provider store={props.store}>
          <DismissibleTextForm {...props} />
        </Provider>
      </I18nProvider>,
    );
  };

  const typeSomeText = ({ root, text }) => {
    // Simulate typing in a textarea.
    root.find('.DismissibleTextForm-textarea').simulate(
      'change',
      createFakeEvent({
        target: { value: text },
      }),
    );
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

    expect(root.find('.DismissibleTextForm-submit')).toHaveClassName(
      'my-class',
    );
  });

  it('renders a default cancel button', () => {
    const root = shallowRender({ dismissButtonText: undefined });

    expect(root.find('.DismissibleTextForm-dismiss').children()).toHaveText(
      'Cancel',
    );
  });

  it('lets you configure the cancel button text', () => {
    const dismissButtonText = 'Nevermind, cancel it';
    const root = shallowRender({ dismissButtonText });

    expect(root.find('.DismissibleTextForm-dismiss').children()).toHaveText(
      dismissButtonText,
    );
  });

  it('renders a placeholder', () => {
    const root = shallowRender({
      placeholder: 'Enter some text',
    });

    expect(root.find('.DismissibleTextForm-textarea')).toHaveProp(
      'placeholder',
      'Enter some text',
    );
  });

  it('lets you render text', () => {
    const root = shallowRender({
      text: 'Some text to edit',
    });

    expect(root.find('.DismissibleTextForm-textarea')).toHaveProp(
      'value',
      'Some text to edit',
    );
  });

  it('focuses the textarea on mount', () => {
    mountRender();
    // This checks that textarea.focus() was called.
    expect(document.activeElement.className).toEqual(
      'DismissibleTextForm-textarea',
    );
  });

  it('calls back when dismissing the textarea', () => {
    const onDismiss = sinon.stub();
    const root = shallowRender({ onDismiss });

    root
      .find('.DismissibleTextForm-dismiss')
      .simulate('click', createFakeEvent());

    sinon.assert.called(onDismiss);
  });

  it('clears the form onDismiss', () => {
    const root = shallowRender({ onDismiss: sinon.stub() });

    typeSomeText({ root, text: 'Example text' });

    root
      .find('.DismissibleTextForm-dismiss')
      .simulate('click', createFakeEvent());

    expect(root.find('.DismissibleTextForm-textarea')).toHaveProp('value', '');
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
      event,
      text: enteredText,
    });
  });

  it('lets you configure the submit button text', () => {
    const root = shallowRender({
      submitButtonText: 'Submit the form',
    });

    expect(root.find('.DismissibleTextForm-submit').childAt(0)).toHaveText(
      'Submit the form',
    );
  });

  it('lets you configure the in-progress submit button text', () => {
    const root = shallowRender({
      submitButtonInProgressText: 'Submitting the form',
      isSubmitting: true,
    });

    expect(root.find('.DismissibleTextForm-submit').childAt(0)).toHaveText(
      'Submitting the form',
    );
  });

  it('disables the submit button while submitting the form', () => {
    const root = shallowRender({ isSubmitting: true, text: 'Some text' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('disables the submit button before text has been entered', () => {
    const root = shallowRender({ text: '' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('disables submit button before non-empty text has been entered', () => {
    // Enter only white space:
    const root = shallowRender({ text: '    ' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('disables submit button before the text has changed', () => {
    const root = shallowRender({ text: 'Some text' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('disables the dismiss button while submitting the form', () => {
    const root = shallowRender({ isSubmitting: true });

    expect(root.find('.DismissibleTextForm-dismiss')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('enables the dismiss button while not submitting the form', () => {
    const root = shallowRender({ isSubmitting: false });

    expect(root.find('.DismissibleTextForm-dismiss')).toHaveProp(
      'disabled',
      false,
    );
  });

  it('enables the submit button after text has been entered', () => {
    const root = shallowRender({ text: '' });

    typeSomeText({ root, text: 'Typing some text...' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveProp(
      'disabled',
      false,
    );
  });

  it('disables the submit button when updating with whitespaces', () => {
    const root = shallowRender({ text: 'Some Text' });

    typeSomeText({ root, text: '   ' });

    expect(root.find('.DismissibleTextForm-submit')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('disables the textarea when submitting the form', () => {
    const root = shallowRender({ isSubmitting: true });

    expect(root.find('.DismissibleTextForm-textarea')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('enables the textarea when not submitting the form', () => {
    const root = shallowRender({ isSubmitting: false });

    expect(root.find('.DismissibleTextForm-textarea')).toHaveProp(
      'disabled',
      false,
    );
  });

  it('hides the delete button when onDelete is empty', () => {
    const root = shallowRender({ onDelete: null });

    expect(root.find('.DismissibleTextForm-delete')).toHaveLength(0);
  });

  it('displays the delete button when onDelete is provided', () => {
    const root = shallowRender({ onDelete: sinon.stub() });

    const deleteButton = root.find('.DismissibleTextForm-delete');
    expect(deleteButton).toHaveLength(1);
    expect(deleteButton).toHaveProp('buttonType', 'alert');
    expect(deleteButton.childAt(0)).toHaveText('Delete');
  });

  it('creates micro buttons when requested', () => {
    const root = shallowRender({
      microButtons: true,
      onDelete: sinon.stub(),
      onDismiss: sinon.stub(),
    });

    expect(root.find('.DismissibleTextForm-delete')).toHaveProp('micro', true);
    expect(root.find('.DismissibleTextForm-submit')).toHaveProp('micro', true);
    expect(root.find('.DismissibleTextForm-dismiss')).toHaveProp('micro', true);
  });

  it('creates puffy buttons when requested', () => {
    const root = shallowRender({
      onDelete: sinon.stub(),
      onDismiss: sinon.stub(),
      puffyButtons: true,
    });

    expect(root.find('.DismissibleTextForm-delete')).toHaveProp('puffy', true);
    expect(root.find('.DismissibleTextForm-submit')).toHaveProp('puffy', true);
    expect(root.find('.DismissibleTextForm-dismiss')).toHaveProp('puffy', true);
  });

  it('creates non-micro, non-puffy buttons by default', () => {
    const root = shallowRender({
      onDismiss: sinon.stub(),
      onDelete: sinon.stub(),
    });

    expect(root.find('.DismissibleTextForm-delete')).toHaveProp('micro', false);
    expect(root.find('.DismissibleTextForm-submit')).toHaveProp('micro', false);
    expect(root.find('.DismissibleTextForm-dismiss')).toHaveProp(
      'micro',
      false,
    );

    expect(root.find('.DismissibleTextForm-delete')).toHaveProp('puffy', false);
    expect(root.find('.DismissibleTextForm-submit')).toHaveProp('puffy', false);
    expect(root.find('.DismissibleTextForm-dismiss')).toHaveProp(
      'puffy',
      false,
    );
  });

  it('cannot create conflicting button types', () => {
    expect(() => {
      shallowRender({ puffyButtons: true, microButtons: true });
    }).toThrow(/microButtons and puffyButtons cannot both be true/);
  });

  it('disables the delete button when there is no text', () => {
    const root = shallowRender({ onDelete: sinon.stub(), text: '' });

    expect(root.find('.DismissibleTextForm-delete')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('enables the delete button after text has been entered', () => {
    const root = shallowRender({ onDelete: sinon.stub(), text: '' });

    typeSomeText({ root, text: 'Typing some text...' });

    expect(root.find('.DismissibleTextForm-delete')).toHaveProp(
      'disabled',
      false,
    );
  });

  it('calls back when clicking the delete button', () => {
    const onDelete = sinon.stub();
    const root = shallowRender({ onDelete });
    const enteredText = 'Some review text';

    typeSomeText({ root, text: enteredText });

    // Submit the form.
    const event = createFakeEvent();
    root.find('.DismissibleTextForm-delete').simulate('click', event);

    sinon.assert.called(event.preventDefault);
    sinon.assert.called(onDelete);
  });

  it('can hide the cancel/dismiss button', () => {
    const root = shallowRender({ onDismiss: undefined });

    expect(root.find('.DismissibleTextForm-dismiss')).toHaveLength(0);
  });

  it('hides a formFooter by default', () => {
    const root = shallowRender();

    expect(root.find('.DismissibleTextForm-formFooter')).toHaveLength(0);
  });

  it('renders a formFooter', () => {
    const root = shallowRender({
      formFooter: <div className="custom-formFooter" />,
    });

    expect(root.find('.DismissibleTextForm-formFooter')).toHaveLength(1);
    expect(
      root.find('.DismissibleTextForm-formFooter .custom-formFooter'),
    ).toHaveLength(1);
  });

  it('renders all buttons in a default order', () => {
    const root = shallowRender({
      onDelete: sinon.stub(),
      onDismiss: sinon.stub(),
    });

    const allButtons = root.find('.DismissibleTextForm-buttons');
    expect(allButtons.childAt(0)).toHaveClassName(
      'DismissibleTextForm-dismiss',
    );
    expect(allButtons.childAt(1)).toHaveClassName(
      'DismissibleTextForm-delete-submit-buttons',
    );

    const submitButtons = root.find(
      '.DismissibleTextForm-delete-submit-buttons',
    );
    expect(submitButtons.childAt(0)).toHaveClassName(
      'DismissibleTextForm-delete',
    );
    expect(submitButtons.childAt(1)).toHaveClassName(
      'DismissibleTextForm-submit',
    );
  });

  it('can reverse the button order', () => {
    const root = shallowRender({
      onDelete: sinon.stub(),
      onDismiss: sinon.stub(),
      reverseButtonOrder: true,
    });

    const allButtons = root.find('.DismissibleTextForm-buttons');
    expect(allButtons.childAt(0)).toHaveClassName(
      'DismissibleTextForm-delete-submit-buttons',
    );
    expect(allButtons.childAt(1)).toHaveClassName(
      'DismissibleTextForm-dismiss',
    );

    const submitButtons = root.find(
      '.DismissibleTextForm-delete-submit-buttons',
    );
    expect(submitButtons.childAt(0)).toHaveClassName(
      'DismissibleTextForm-submit',
    );
    expect(submitButtons.childAt(1)).toHaveClassName(
      'DismissibleTextForm-delete',
    );
  });

  describe('LocalState', () => {
    it('configures LocalState', () => {
      const _createLocalState = sinon.spy(createFakeLocalState);
      const id = 'some-form-id';

      shallowRender({ id, _createLocalState });

      sinon.assert.calledWith(_createLocalState, id);
    });

    it('loads LocalState on mount', () => {
      const loadSpy = sinon.spy(() => Promise.resolve(null));
      shallowRender({
        _createLocalState: () => createFakeLocalState({ load: loadSpy }),
      });

      sinon.assert.called(loadSpy);
    });

    it('populates the form with text from LocalState', async () => {
      const text = 'Some text that was saved to LocalState';
      const root = shallowRender({
        _createLocalState: () =>
          createFakeLocalState({ load: () => Promise.resolve({ text }) }),
      });

      await root.instance().checkForStoredState();

      expect(root.find('.DismissibleTextForm-textarea')).toHaveProp(
        'value',
        text,
      );
    });

    it('recreates LocalState on update when the ID changes', () => {
      const loadSpy = sinon.spy(() => Promise.resolve(null));
      const _createLocalState = sinon.spy(() =>
        createFakeLocalState({ load: loadSpy }),
      );

      const root = shallowRender({
        _createLocalState,
        id: 'first-ID',
      });

      _createLocalState.resetHistory();
      loadSpy.resetHistory();

      const secondId = 'second-ID';
      root.setProps({ id: secondId });

      sinon.assert.calledWith(_createLocalState, secondId);
      sinon.assert.called(loadSpy);
    });

    it('does not recreate LocalState on update when ID does not change', () => {
      const loadSpy = sinon.spy(() => Promise.resolve(null));
      const _createLocalState = sinon.spy(() =>
        createFakeLocalState({ load: loadSpy }),
      );

      const id = 'example-ID';
      const root = shallowRender({ id, _createLocalState });

      _createLocalState.resetHistory();
      loadSpy.resetHistory();

      root.setProps({ id });

      sinon.assert.notCalled(_createLocalState);
      sinon.assert.notCalled(loadSpy);
    });

    it('does not populate the form with null data', async () => {
      const root = shallowRender({
        _createLocalState: () =>
          // Set up LocalState to load null data.
          createFakeLocalState({ load: () => Promise.resolve(null) }),
      });

      const text = 'Entered text';
      typeSomeText({ root, text });

      expect(root.find('.DismissibleTextForm-textarea')).toHaveProp(
        'value',
        text,
      );

      // Load the null data.
      await root.instance().checkForStoredState();

      // Make sure the text was not erased.
      expect(root.find('.DismissibleTextForm-textarea')).toHaveProp(
        'value',
        text,
      );
    });

    it('saves to LocalState when typing', () => {
      const saveSpy = sinon.spy(() => Promise.resolve());
      const root = shallowRender({
        _createLocalState: () => createFakeLocalState({ save: saveSpy }),
      });

      const text = 'Example text';
      typeSomeText({ root, text });

      sinon.assert.calledWith(saveSpy, { text });
    });

    it('clears LocalState onDismiss', () => {
      const clearSpy = sinon.spy(() => Promise.resolve());
      const root = shallowRender({
        _createLocalState: () => createFakeLocalState({ clear: clearSpy }),
        onDismiss: sinon.stub(),
      });

      root
        .find('.DismissibleTextForm-dismiss')
        .simulate('click', createFakeEvent());

      sinon.assert.called(clearSpy);
    });

    it('clears LocalState onDelete', () => {
      const clearSpy = sinon.spy(() => Promise.resolve());
      const root = shallowRender({
        _createLocalState: () => createFakeLocalState({ clear: clearSpy }),
        onDelete: sinon.stub(),
      });

      root
        .find('.DismissibleTextForm-delete')
        .simulate('click', createFakeEvent());

      sinon.assert.called(clearSpy);
    });

    it('clears LocalState onSubmit', () => {
      const clearSpy = sinon.spy(() => Promise.resolve());
      const root = shallowRender({
        _createLocalState: () => createFakeLocalState({ clear: clearSpy }),
        onSubmit: sinon.stub(),
      });

      root
        .find('.DismissibleTextForm-submit')
        .simulate('click', createFakeEvent());

      sinon.assert.called(clearSpy);
    });
  });
});
