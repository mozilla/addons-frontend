import * as React from 'react';

import {
  beginFormOverlaySubmit,
  closeFormOverlay,
  finishFormOverlaySubmit,
  openFormOverlay,
} from 'core/reducers/formOverlay';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFakeEvent, fakeI18n, shallowUntilTarget,
} from 'tests/unit/helpers';
import FormOverlay, { FormOverlayBase } from 'ui/components/FormOverlay';


describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (customProps = {}) => {
    const props = {
      i18n: fakeI18n(),
      title: 'Form Title',
      id: 'example-form-id',
      store,
      ...customProps,
    };
    return shallowUntilTarget(
      <FormOverlay {...props} />, FormOverlayBase
    );
  };

  it('renders a custom class name', () => {
    const root = render({ className: 'some-class' });

    expect(root).toHaveClassName('some-class');
    expect(root).toHaveClassName('FormOverlay');
  });

  it('renders a title', () => {
    const root = render({ title: 'Some Form' });

    expect(root.find('.FormOverlay-h3')).toHaveText('Some Form');
  });

  it('is open by default', () => {
    const root = render({ children: [<input key={1} />] });

    expect(root.find('input')).toHaveLength(1);
  });

  it('can be closed', () => {
    const id = 'some-id';
    store.dispatch(openFormOverlay(id));
    store.dispatch(closeFormOverlay(id));
    const root = render({ id, children: [<input key={1} />] });

    expect(root.find('input')).toHaveLength(0);
  });

  it('can be opened', () => {
    const id = 'some-id';
    store.dispatch(closeFormOverlay(id));
    store.dispatch(openFormOverlay(id));
    const root = render({ id, children: [<input key={1} />] });

    expect(root.find('input')).toHaveLength(1);
  });

  it('closes when clicking the X', () => {
    const id = 'some-id';
    sinon.spy(store, 'dispatch');
    const root = render({ id });
    root.find('.FormOverlay-x-closer')
      .simulate('click', createFakeEvent());

    sinon.assert.calledWith(store.dispatch, closeFormOverlay(id));
  });

  it('closes when clicking on the background', () => {
    const id = 'some-id';
    sinon.spy(store, 'dispatch');
    const root = render({ id });
    root.find('.FormOverlay').simulate('click', createFakeEvent());

    sinon.assert.calledWith(store.dispatch, closeFormOverlay(id));
  });

  it('stops click events from propagating past the overlay', () => {
    const root = render();
    const event = createFakeEvent();
    root.find('.FormOverlay-overlay').simulate('click', event);

    sinon.assert.called(event.stopPropagation);
  });

  it('closes on cancel', () => {
    const id = 'some-id';
    sinon.spy(store, 'dispatch');
    const root = render({ id });
    root.find('.FormOverlay-cancel').simulate('click', createFakeEvent());

    sinon.assert.calledWith(store.dispatch, closeFormOverlay(id));
  });

  it('calls back on cancel', () => {
    const onCancel = sinon.stub();
    const root = render({ onCancel });
    root.find('.FormOverlay-cancel').simulate('click', createFakeEvent());

    sinon.assert.called(onCancel);
  });

  it('handles an empty cancel callback', () => {
    const root = render({ onCancel: undefined });
    // This should not throw an error.
    root.find('.FormOverlay-cancel').simulate('click', createFakeEvent());
  });

  it('calls back on submit', () => {
    const onSubmit = sinon.stub();
    const root = render({ onSubmit });
    root.find('.FormOverlay-submit').simulate('click', createFakeEvent());

    sinon.assert.called(onSubmit);
  });

  it('handles an empty submit callback', () => {
    const root = render({ onSubmit: undefined });
    // This should not throw an error.
    root.find('.FormOverlay-submit').simulate('click', createFakeEvent());
  });

  it('renders a default submit button', () => {
    const root = render();

    expect(root.find('.FormOverlay-submit').html()).toContain('Submit');
  });

  it('renders a custom submit button', () => {
    const submitText = 'Do The Thing Now';
    const root = render({ submitText });

    expect(root.find('.FormOverlay-submit').html()).toContain(submitText);
  });

  it('enters into a submitting state', () => {
    const id = 'some-form';
    store.dispatch(beginFormOverlaySubmit(id));
    const root = render({ id });

    const button = root.find('.FormOverlay-submit');
    expect(button.html()).toContain('Submitting');
    expect(button).toHaveProp('disabled', true);
    expect(root.find('.FormOverlay-cancel')).toHaveProp('disabled', true);
  });

  it('exits out of a submitting state', () => {
    const id = 'some-form';
    store.dispatch(beginFormOverlaySubmit(id));
    store.dispatch(finishFormOverlaySubmit(id));
    const root = render({ id });

    const button = root.find('.FormOverlay-submit');
    expect(button).toHaveProp('disabled', false);
  });

  it('renders custom submitting text', () => {
    const id = 'some-form';
    const submittingText = 'Now submitting the form';
    store.dispatch(beginFormOverlaySubmit(id));
    const root = render({ id, submittingText });

    const button = root.find('.FormOverlay-submit');
    expect(button.html()).toContain(submittingText);
  });
});
