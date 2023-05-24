/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import { withFixedErrorHandler } from 'amo/errorHandler';
import { getAddonIconUrl } from 'amo/imageUtils';
import translate from 'amo/i18n/translate';
import withUIState from 'amo/withUIState';
import { nl2br, normalizeFileNameId, sanitizeHTML } from 'amo/utils';
import Button from 'amo/components/Button';
import DismissibleTextForm from 'amo/components/DismissibleTextForm';
import Icon from 'amo/components/Icon';
import type {
  DeleteAddonNoteFunc,
  RemoveCollectionAddonFunc,
  SaveAddonNoteFunc,
} from 'amo/pages/Collection';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { AddonType, CollectionAddonType } from 'amo/types/addons';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';
import type { OnSubmitParams } from 'amo/components/DismissibleTextForm';

import './styles.scss';

type Props = {|
  addon: AddonType | CollectionAddonType,
  deleteNote: DeleteAddonNoteFunc,
  removeAddon: RemoveCollectionAddonFunc,
  saveNote: SaveAddonNoteFunc,
|};

type UIStateType = {|
  editingNote: boolean,
|};

const initialUIState: UIStateType = { editingNote: false };

type InternalProps = {|
  ...Props,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
|};

export const extractId = (ownProps: Props | InternalProps): string => {
  const { addon } = ownProps;
  return `editable-collection-addon-${addon.id}`;
};

export class EditableCollectionAddonBase extends React.Component<InternalProps> {
  onEditNote: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();
    this.props.setUIState({ editingNote: true });
  };

  onDeleteNote: () => void = () => {
    const {
      addon: { id: addonId },
      deleteNote,
      errorHandler,
    } = this.props;

    deleteNote(addonId, errorHandler);
  };

  onDismissNoteForm: () => void = () => {
    this.props.setUIState({ editingNote: false });
  };

  onRemoveAddon: HTMLElementEventHandler = (event: ElementEvent) => {
    const {
      addon: { id: addonId },
      removeAddon,
    } = this.props;

    event.preventDefault();
    event.stopPropagation();

    invariant(addonId, 'addonId is required');

    removeAddon(addonId);
  };

  onSaveNote: (notes: OnSubmitParams) => void = (notes: OnSubmitParams) => {
    const {
      addon: { id: addonId },
      errorHandler,
      saveNote,
    } = this.props;

    invariant(addonId, 'addonId is required');

    saveNote(addonId, errorHandler, notes.text);
  };

  render(): React.Node {
    const { addon, errorHandler, i18n } = this.props;
    const showNotes = addon.notes || this.props.uiState.editingNote;
    const iconURL = getAddonIconUrl(addon);

    return (
      <li
        className={makeClassName(
          'EditableCollectionAddon',
          `EditableCollectionAddon--${addon.type}`,
        )}
      >
        <div className="EditableCollectionAddon-details">
          <img
            className="EditableCollectionAddon-icon"
            src={iconURL}
            alt={addon.name.content}
          />
          <h2 className="EditableCollectionAddon-name" lang={addon.name.locale}>
            {addon.name.content}
          </h2>
        </div>
        <div className="EditableCollectionAddon-buttons">
          <div
            className={makeClassName('EditableCollectionAddon-leaveNote', {
              'EditableCollectionAddon-leaveNote--hidden': showNotes,
            })}
          >
            <Button
              buttonType="action"
              className="EditableCollectionAddon-leaveNote-button"
              micro
              onClick={this.onEditNote}
            >
              {i18n.gettext('Leave a note')}
            </Button>
          </div>
          <Button
            buttonType="alert"
            className="EditableCollectionAddon-remove-button"
            micro
            name={addon.id}
            onClick={this.onRemoveAddon}
          >
            {i18n.gettext('Remove')}
          </Button>
        </div>
        {showNotes && (
          <div className="EditableCollectionAddon-notes">
            <h4 className="EditableCollectionAddon-notes-header">
              <Icon name="comments-blue" />
              {this.props.uiState.editingNote
                ? i18n.gettext('Leave a note')
                : i18n.gettext("Collector's note")}
            </h4>

            {this.props.uiState.editingNote ? (
              <>
                {errorHandler.renderErrorIfPresent()}
                <DismissibleTextForm
                  className="EditableCollectionAddon-notes-form"
                  id={`${normalizeFileNameId(__filename)}-${extractId(
                    this.props,
                  )}`}
                  microButtons
                  onDelete={addon.notes ? this.onDeleteNote : null}
                  onDismiss={this.onDismissNoteForm}
                  onSubmit={this.onSaveNote}
                  placeholder={i18n.gettext('Add a comment about this add-on.')}
                  submitButtonText={i18n.gettext('Save')}
                  text={sanitizeHTML(addon.notes || '').__html}
                />
              </>
            ) : (
              <div className="EditableCollectionAddon-notes-read-only">
                <span
                  className="EditableCollectionAddon-notes-content"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={sanitizeHTML(
                    nl2br(addon.notes || ''),
                    ['br', 'a'],
                  )}
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

const EditableCollectionAddon: React.ComponentType<Props> = compose(
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  withUIState({
    fileName: __filename,
    extractId,
    initialState: initialUIState,
    resetOnUnmount: true,
  }),
)(EditableCollectionAddonBase);

export default EditableCollectionAddon;
