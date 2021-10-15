import * as React from 'react';

import EditableCollectionAddon, {
  EditableCollectionAddonBase,
  extractId,
} from 'amo/components/EditableCollectionAddon';
import { ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import {
  applyUIStateChanges,
  createFakeEvent,
  createInternalAddonWithLang,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  setUIState,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Button from 'amo/components/Button';
import DismissibleTextForm from 'amo/components/DismissibleTextForm';
import Icon from 'amo/components/Icon';

describe(__filename, () => {
  function render(props = {}) {
    const addon = props.addon || {
      ...createInternalAddonWithLang(fakeAddon),
      notes: props.notes || null,
    };

    return shallowUntilTarget(
      <EditableCollectionAddon
        addon={addon}
        errorHandler={createStubErrorHandler()}
        i18n={fakeI18n()}
        deleteNote={sinon.spy()}
        removeAddon={sinon.spy()}
        saveNote={sinon.spy()}
        store={dispatchClientMetadata().store}
        {...props}
      />,
      EditableCollectionAddonBase,
    );
  }

  function renderAndEditNote({
    store = dispatchClientMetadata().store,
    ...customProps
  } = {}) {
    const root = render({ store, ...customProps });
    setUIState({ root, store, change: { editingNote: true } });

    return root;
  }

  it('renders a class name if provided', () => {
    const className = 'testClassName';
    const root = render({ className });
    expect(root).toHaveClassName(className);
  });

  it('renders a class name with its type', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const root = render({ addon });
    expect(root).toHaveClassName(
      `EditableCollectionAddon--${ADDON_TYPE_STATIC_THEME}`,
    );
  });

  it("renders the add-on's icon", () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const root = render({ addon });
    expect(root.find('.EditableCollectionAddon-icon')).toHaveProp(
      'src',
      addon.icon_url,
    );
  });

  it('renders the leave a note button icon', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const root = render({ addon });
    const button = root.find('.EditableCollectionAddon-leaveNote-button');
    expect(button).toHaveProp('buttonType', 'action');
    expect(button).toHaveProp('micro', true);
    expect(button).toHaveProp('onClick', root.instance().onEditNote);
    expect(button.prop('children')).toEqual('Leave a note');
  });

  it('displays the leave a note button when no notes exist', () => {
    const root = render({ notes: null });
    expect(root.find('.EditableCollectionAddon-leaveNote')).not.toHaveClassName(
      'EditableCollectionAddon-leaveNote--hidden',
    );
  });

  it('hides the leave a note button when notes exist', () => {
    const root = render({ notes: 'some notes' });
    expect(root.find('.EditableCollectionAddon-leaveNote')).toHaveClassName(
      'EditableCollectionAddon-leaveNote--hidden',
    );
  });

  it('renders the remove button', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const root = render({ addon });
    const button = root.find('.EditableCollectionAddon-remove-button');
    expect(button).toHaveProp('buttonType', 'alert');
    expect(button).toHaveProp('micro', true);
    expect(button).toHaveProp('name', addon.id);
    expect(button).toHaveProp('onClick', root.instance().onRemoveAddon);
    expect(button.prop('children')).toEqual('Remove');
  });

  it('calls the removeAddon function when the remove button is clicked', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const removeAddon = sinon.spy();
    const root = render({ addon, removeAddon });

    const removeButton = root.find('.EditableCollectionAddon-remove-button');
    const clickEvent = createFakeEvent();
    removeButton.simulate('click', clickEvent);

    sinon.assert.called(clickEvent.preventDefault);
    sinon.assert.called(clickEvent.stopPropagation);
    sinon.assert.calledWith(removeAddon, addon.id);
  });

  describe('notes area', () => {
    it('hides the notes area by default', () => {
      const root = render();

      expect(root.find('.EditableCollectionAddon-notes')).toHaveLength(0);
    });

    it('shows the read-only version of the notes area if there are notes', () => {
      const notes = 'Some notes.';
      const root = render({ notes });

      const notesArea = root.find('.EditableCollectionAddon-notes');
      expect(notesArea).toHaveLength(1);
      expect(notesArea.find(Icon)).toHaveProp('name', 'comments-blue');
      expect(
        root.find('.EditableCollectionAddon-notes-read-only'),
      ).toHaveLength(1);

      const expectedHTML =
        '<span class="EditableCollectionAddon-notes-content">Some notes.</span>';
      expect(
        notesArea.find('.EditableCollectionAddon-notes-content'),
      ).toHaveHTML(expectedHTML);

      const editButton = notesArea.find(Button);
      expect(editButton).toHaveClassName(
        'EditableCollectionAddon-notes-edit-button',
      );
      expect(editButton).toHaveProp('buttonType', 'action');
      expect(editButton).toHaveProp('micro', true);
      expect(editButton).toHaveProp('onClick', root.instance().onEditNote);
      expect(editButton).toHaveProp('buttonType', 'action');

      // The form should not be shown.
      expect(root.find('.EditableCollectionAddon-notes-form')).toHaveLength(0);
    });

    it('renders newlines in notes', () => {
      const notes = 'Some\nnotes.';
      const root = render({ notes });

      const expectedHTML =
        '<span class="EditableCollectionAddon-notes-content">Some<br>notes.</span>';
      expect(root.find('.EditableCollectionAddon-notes-content')).toHaveHTML(
        expectedHTML,
      );
    });

    it('shows an empty notes form when the leave a note button is clicked', () => {
      const { store } = dispatchClientMetadata();
      const root = render({ store });

      expect(root.find('.EditableCollectionAddon-notes')).toHaveLength(0);

      root
        .find('.EditableCollectionAddon-leaveNote-button')
        .simulate('click', createFakeEvent());
      applyUIStateChanges({ root, store });

      expect(root.find('.EditableCollectionAddon-notes')).toHaveLength(1);

      const notesForm = root.find('.EditableCollectionAddon-notes-form');
      expect(notesForm).toHaveLength(1);
      expect(notesForm).toHaveProp('microButtons', true);
      expect(notesForm).toHaveProp('onDelete', null);
      expect(notesForm).toHaveProp(
        'onDismiss',
        root.instance().onDismissNoteForm,
      );
      expect(notesForm).toHaveProp('onSubmit', root.instance().onSaveNote);
      expect(notesForm).toHaveProp(
        'placeholder',
        'Add a comment about this add-on.',
      );
      expect(notesForm).toHaveProp('submitButtonText', 'Save');
      expect(notesForm).toHaveProp('text', '');

      // The read-only portion should not be shown.
      expect(
        root.find('.EditableCollectionAddon-notes-read-only'),
      ).toHaveLength(0);
    });

    it('renders clickable URL in notes', () => {
      const notes = `<a href="url">http://www.w3schools.com</a>`;
      const root = render({ notes });

      expect(root.find('.EditableCollectionAddon-notes-content')).toHaveHTML(
        `<span class="EditableCollectionAddon-notes-content"> ${notes}</span>`,
      );
    });

    it('does not show <a> tag in DismissibleTextForm when editing notes', () => {
      const { store } = dispatchClientMetadata();
      const url = 'http://w3schools.com';
      const notes = `<a href="to somewhere">${url}</a>`;
      const root = render({ notes, store });
      root
        .find('.EditableCollectionAddon-notes-edit-button')
        .simulate('click', createFakeEvent());
      applyUIStateChanges({ root, store });

      expect(root.find(DismissibleTextForm)).toHaveProp('text', url);
    });

    it('changes UI state when the leave a note button is clicked', () => {
      const { store } = dispatchClientMetadata();
      const root = render({ store });

      expect(root.instance().props.uiState.editingNote).toEqual(false);

      root
        .find('.EditableCollectionAddon-leaveNote-button')
        .simulate('click', createFakeEvent());
      applyUIStateChanges({ root, store });

      expect(root.instance().props.uiState.editingNote).toEqual(true);
    });

    it('shows a populated notes form when the edit button icon is clicked', () => {
      const notes = 'Some notes.';
      const { store } = dispatchClientMetadata();
      const root = render({ notes, store });

      root
        .find('.EditableCollectionAddon-notes-edit-button')
        .simulate('click', createFakeEvent());
      applyUIStateChanges({ root, store });

      const notesForm = root.find('.EditableCollectionAddon-notes-form');
      expect(notesForm).toHaveLength(1);
      // The read-only portion should not be shown.
      expect(
        root.find('.EditableCollectionAddon-notes-read-only'),
      ).toHaveLength(0);

      // Make sure props.notes is included in the form.
      expect(notesForm).toHaveProp('text', notes);
    });

    it('hides the notes form when the cancel button is clicked on the DismissibleTextForm', () => {
      const { store } = dispatchClientMetadata();
      const notes = 'Some notes.';

      const root = renderAndEditNote({ notes, store });
      let notesForm = root.find('.EditableCollectionAddon-notes-form');
      expect(notesForm).toHaveLength(1);

      // This simulates the user clicking the "Cancel" button on the
      // DismissibleTextForm.
      const onDismissNoteForm = notesForm.prop('onDismiss');
      onDismissNoteForm();

      applyUIStateChanges({ root, store });

      notesForm = root.find('.EditableCollectionAddon-notes-form');
      expect(notesForm).toHaveLength(0);
    });

    it('calls deleteNote when clicking delete on DismissibleTextForm', () => {
      const notes = 'Some notes.';
      const addon = {
        ...fakeAddon,
        notes,
      };
      const deleteNote = sinon.spy();
      const errorHandler = createStubErrorHandler();

      const root = renderAndEditNote({ addon, deleteNote, errorHandler });

      const notesForm = root.find('.EditableCollectionAddon-notes-form');

      // This simulates the user clicking the "Delete" button on the
      // DismissibleTextForm.
      const onDeleteNote = notesForm.props().onDelete;
      onDeleteNote();
      sinon.assert.callCount(deleteNote, 1);
      sinon.assert.calledWith(deleteNote, addon.id, errorHandler);
    });

    it('calls saveNote when saving DismissibleTextForm', () => {
      const notes = 'Some notes.';
      const addon = {
        ...fakeAddon,
        notes,
      };
      const saveNote = sinon.spy();
      const errorHandler = createStubErrorHandler();

      const root = renderAndEditNote({ addon, errorHandler, saveNote });
      const notesForm = root.find('.EditableCollectionAddon-notes-form');

      // This simulates the user clicking the "Save" button on the
      // DismissibleTextForm.
      const onSaveNote = notesForm.props().onSubmit;
      onSaveNote({ text: notes });
      sinon.assert.callCount(saveNote, 1);
      sinon.assert.calledWith(saveNote, addon.id, errorHandler, notes);
    });

    it('configures DismissibleTextForm with an id', () => {
      const { store } = dispatchClientMetadata();

      const root = renderAndEditNote({ notes: 'This add-on is buggy', store });

      const formId = root.find(DismissibleTextForm).prop('id');
      expect(formId).toContain('EditableCollectionAddon');
      expect(formId).toContain(extractId(root.instance().props));
    });
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID with an add-on', () => {
      const addon = fakeAddon;
      expect(extractId({ addon })).toEqual(
        `editable-collection-addon-${addon.id}`,
      );
    });
  });
});
