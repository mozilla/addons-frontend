import * as React from 'react';

import EditableCollectionAddon, {
  EditableCollectionAddonBase,
  extractId,
} from 'amo/components/EditableCollectionAddon';
import fallbackIcon from 'amo/img/icons/default-64.png';
import { createInternalAddon } from 'core/reducers/addons';
import { sanitizeHTML } from 'core/utils';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';

describe(__filename, () => {
  function render(props = {}) {
    return shallowUntilTarget(
      <EditableCollectionAddon
        addon={props.addon || createInternalAddon(fakeAddon)}
        errorHandler={createStubErrorHandler()}
        i18n={fakeI18n()}
        deleteNote={sinon.spy()}
        removeAddon={sinon.spy()}
        saveNote={sinon.spy()}
        store={dispatchClientMetadata().store}
        {...props}
      />,
      EditableCollectionAddonBase
    );
  }

  it('renders a className if provided', () => {
    const className = 'testClassName';
    const root = render({ className });
    expect(root).toHaveClassName(className);
  });

  it("renders the add-on's icon", () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });
    expect(root.find('.EditableCollectionAddon-icon'))
      .toHaveProp('src', addon.icon_url);
  });

  it('renders the fallback icon if the origin is not allowed', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      icon_url: 'http://foo.com/hax.png',
    });
    const root = render({ addon });
    expect(root.find('.EditableCollectionAddon-icon'))
      .toHaveProp('src', fallbackIcon);
  });

  it('renders the comments icon', () => {
    const root = render();
    expect(root.find(Icon)).toHaveProp('name', 'comments');
  });

  it('renders the remove button icon', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });
    const button = root.find(Button);
    expect(button).toHaveProp('name', addon.id);
    expect(button.prop('children')).toEqual('Remove');
  });

  it('calls the removeAddon function when the remove button is clicked', () => {
    const addon = createInternalAddon(fakeAddon);
    const removeAddon = sinon.spy();
    const root = render({ addon, removeAddon });

    const removeButton = root.find(Button);
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
      const addon = {
        ...fakeAddon,
        notes,
      };
      const root = render({ addon });
      const notesArea = root.find('.EditableCollectionAddon-notes');
      expect(notesArea.find(Icon)).toHaveProp('name', 'comments-blue');
      expect(root.find('.EditableCollectionAddon-notes-read-only'))
        .toHaveLength(1);
      expect(notesArea.find('.EditableCollectionAddon-notes-content'))
        .toHaveProp('dangerouslySetInnerHTML', sanitizeHTML(notes));
      const editButton = notesArea.find(Button);
      expect(editButton).toHaveClassName('EditableCollectionAddon-notes-edit-button');
      expect(editButton).toHaveProp('buttonType', 'action');
      expect(editButton).toHaveProp('micro', true);
      expect(editButton).toHaveProp('onClick', root.instance().onEditNote);
      expect(editButton).toHaveProp('buttonType', 'action');
      // The form should not be shown.
      expect(root.find('.EditableCollectionAddon-notes-form')).toHaveLength(0);
    });

    it('shows an empty notes form when the comment icon is clicked', () => {
      const root = render();

      expect(root.find('.EditableCollectionAddon-notes')).toHaveLength(0);
      const commentIcon = root.find('.EditableCollectionAddon-create-note');
      const clickEvent = createFakeEvent();
      commentIcon.simulate('click', clickEvent);
      expect(root.find('.EditableCollectionAddon-notes')).toHaveLength(1);
      const notesForm = root.find('.EditableCollectionAddon-notes-form');
      expect(notesForm).toHaveLength(1);
      // The read-only portion should not be shown.
      expect(root.find('.EditableCollectionAddon-notes-read-only'))
        .toHaveLength(0);
      expect(notesForm).toHaveProp('microButtons', true);
      expect(notesForm).toHaveProp('onDelete', root.instance().onDeleteNote);
      expect(notesForm).toHaveProp('onDismiss', root.instance().onDismissNoteForm);
      expect(notesForm).toHaveProp('onSubmit', root.instance().onSaveNote);
      expect(notesForm).toHaveProp('placeholder', 'Add a comment about this add-on.');
      expect(notesForm).toHaveProp('submitButtonText', 'Save');
      expect(notesForm).toHaveProp('text', undefined);
    });

    it('shows a populated notes form when the edit button icon is clicked', () => {
      const notes = 'Some notes.';
      const addon = {
        ...fakeAddon,
        notes,
      };

      const root = render({ addon });
      expect(root.find('.EditableCollectionAddon-notes-form')).toHaveLength(0);
      const editButton = root.find('.EditableCollectionAddon-notes-edit-button');
      const clickEvent = createFakeEvent();
      editButton.simulate('click', clickEvent);
      const notesForm = root.find('.EditableCollectionAddon-notes-form');
      expect(notesForm).toHaveLength(1);
      // The read-only portion should not be shown.
      expect(root.find('.EditableCollectionAddon-notes-read-only'))
        .toHaveLength(0);
      expect(notesForm).toHaveProp('text', notes);
    });

    it('hides the notes form when the cancel button is clicked on the DismissibleTextForm', () => {
      const notes = 'Some notes.';
      const addon = {
        ...fakeAddon,
        notes,
      };

      let root = render({ addon });
      expect(root.find('.EditableCollectionAddon-notes-form')).toHaveLength(0);
      const editButton = root.find('.EditableCollectionAddon-notes-edit-button');
      const clickEvent = createFakeEvent();
      editButton.simulate('click', clickEvent);
      let notesForm = root.find('.EditableCollectionAddon-notes-form');
      expect(notesForm).toHaveLength(1);

      // This simulates the user clicking the "Cancel" button on the
      // DismissibleTextForm.
      const onDismissNoteForm = notesForm.props().onDismiss;
      onDismissNoteForm();

      root = render({ addon });
      notesForm = root.find('.EditableCollectionAddon-notes-form');
      expect(notesForm).toHaveLength(0);
    });

    it('calls deleteNote when the delete button is clicked on the DismissibleTextForm', () => {
      const notes = 'Some notes.';
      const addon = {
        ...fakeAddon,
        notes,
      };
      const deleteNote = sinon.spy();
      const errorHandler = createStubErrorHandler();

      const root = render({ addon, deleteNote, errorHandler });

      expect(root.find('.EditableCollectionAddon-notes-form')).toHaveLength(0);
      const editButton = root.find('.EditableCollectionAddon-notes-edit-button');
      const clickEvent = createFakeEvent();
      editButton.simulate('click', clickEvent);
      const notesForm = root.find('.EditableCollectionAddon-notes-form');

      // This simulates the user clicking the "Delete" button on the
      // DismissibleTextForm.
      const onDeleteNote = notesForm.props().onDelete;
      onDeleteNote();
      sinon.assert.callCount(deleteNote, 1);
      sinon.assert.calledWith(deleteNote, addon.id, errorHandler);
    });

    it('calls saveNote when the save button is clicked on the DismissibleTextForm', () => {
      const notes = 'Some notes.';
      const addon = {
        ...fakeAddon,
        notes,
      };
      const saveNote = sinon.spy();
      const errorHandler = createStubErrorHandler();

      const root = render({ addon, errorHandler, saveNote });

      expect(root.find('.EditableCollectionAddon-notes-form')).toHaveLength(0);
      const editButton = root.find('.EditableCollectionAddon-notes-edit-button');
      const clickEvent = createFakeEvent();
      editButton.simulate('click', clickEvent);
      const notesForm = root.find('.EditableCollectionAddon-notes-form');

      // This simulates the user clicking the "Save" button on the
      // DismissibleTextForm.
      const onSaveNote = notesForm.props().onSubmit;
      onSaveNote({ text: notes });
      sinon.assert.callCount(saveNote, 1);
      sinon.assert.calledWith(saveNote, addon.id, errorHandler, notes);
    });
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID with an add-on', () => {
      const addon = fakeAddon;
      expect(extractId({ addon }))
        .toEqual(`editable-collection-addon-${addon.id}`);
    });

    it('returns a unique ID without an add-on', () => {
      expect(extractId({ addon: null })).toEqual('editable-collection-addon-');
    });
  });
});
