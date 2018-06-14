/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import { withFixedErrorHandler } from 'core/errorHandler';
import { getAddonIconUrl } from 'core/imageUtils';
import translate from 'core/i18n/translate';
import { nl2br, sanitizeHTML } from 'core/utils';
import Button from 'ui/components/Button';
import DismissibleTextForm from 'ui/components/DismissibleTextForm';
import Icon from 'ui/components/Icon';
import type {
  DeleteAddonNoteFunc,
  RemoveCollectionAddonFunc,
  SaveAddonNoteFunc,
} from 'amo/components/Collection';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { CollectionAddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { OnSubmitParams } from 'ui/components/DismissibleTextForm';

import './styles.scss';

type Props = {|
  addon: CollectionAddonType,
  className?: string,
  deleteNote: DeleteAddonNoteFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  removeAddon: RemoveCollectionAddonFunc,
  saveNote: SaveAddonNoteFunc,
|};

type State = {|
  editingNote: boolean,
|};

export class EditableCollectionAddonBase extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      editingNote: false,
    };
  }

  onEditNote = (event: SyntheticEvent<HTMLElement>) => {
    event.preventDefault();
    this.setState({ editingNote: true });
  };

  onDeleteNote = () => {
    const { addon: { id: addonId }, deleteNote, errorHandler } = this.props;

    deleteNote(addonId, errorHandler);
  };

  onDismissNoteForm = () => {
    this.setState({ editingNote: false });
  };

  onRemoveAddon = (event: SyntheticEvent<HTMLButtonElement>) => {
    const { addon: { id: addonId }, removeAddon } = this.props;

    event.preventDefault();
    event.stopPropagation();

    invariant(addonId, 'addonId is required');

    removeAddon(addonId);
  };

  onSaveNote = (notes: OnSubmitParams) => {
    const { addon: { id: addonId }, errorHandler, saveNote } = this.props;

    invariant(addonId, 'addonId is required');

    saveNote(addonId, errorHandler, notes.text);
  }

  render() {
    const { addon, className, errorHandler, i18n } = this.props;
    const showNotes = addon.notes || this.state.editingNote;

    const iconURL = getAddonIconUrl(addon);
    return (
      <li className={makeClassName('EditableCollectionAddon', className)}>
        <img className="EditableCollectionAddon-icon" src={iconURL} alt="" />
        <h2 className="EditableCollectionAddon-name">
          {addon.name}
        </h2>
        <div className="EditableCollectionAddon-comments-icon">
          <a
            href="#editComment"
            onClick={this.onEditNote}
            className="EditableCollectionAddon-edit-note"
          >
            <Icon name="comments" />
          </a>
        </div>
        <div className="EditableCollectionAddon-remove-button">
          <Button
            name={addon.id}
            buttonType="alert"
            onClick={this.onRemoveAddon}
            micro
          >
            {i18n.gettext('Remove')}
          </Button>
        </div>
        {showNotes && (
          <div className="EditableCollectionAddon-notes">
            <h4 className="EditableCollectionAddon-notes-header">
              <Icon name="comments-blue" />
              {i18n.gettext('User comment')}
            </h4>

            {this.state.editingNote ? (
              <React.Fragment>
                {errorHandler.renderErrorIfPresent()}
                <DismissibleTextForm
                  className="EditableCollectionAddon-notes-form"
                  microButtons
                  onDelete={this.onDeleteNote}
                  onDismiss={this.onDismissNoteForm}
                  onSubmit={this.onSaveNote}
                  placeholder={i18n.gettext('Add a comment about this add-on.')}
                  submitButtonText={i18n.gettext('Save')}
                  text={addon.notes}
                />
              </React.Fragment>
            ) : (
              <div className="EditableCollectionAddon-notes-read-only">
                <span
                  className="EditableCollectionAddon-notes-content"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={
                    sanitizeHTML(nl2br(addon.notes), ['br'])
                  }
                />
                <div className="EditableCollectionAddon-notes-buttons">
                  <Button
                    buttonType="action"
                    className="EditableCollectionAddon-notes-edit-button"
                    micro
                    onClick={this.onEditNote}
                  >
                    {i18n.gettext('Edit')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </li>
    );
  }
}

export const extractId = (ownProps: Props) => {
  const { addon } = ownProps;
  return `editable-collection-addon-${addon.id}`;
};

export default compose(
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(EditableCollectionAddonBase);
