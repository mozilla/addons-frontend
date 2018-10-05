/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import type { I18nType } from 'core/types/i18n';
import type { ButtonType } from 'ui/components/Button';

import './styles.scss';

export type Props = {|
  cancelButtonText?: string | null,
  cancelButtonType?: ButtonType,
  className?: string,
  confirmButtonText?: string | null,
  confirmButtonType?: ButtonType,
  message?: string,
  onCancel: (event: SyntheticEvent<HTMLButtonElement>) => void,
  onConfirm: (event: SyntheticEvent<HTMLButtonElement>) => void,
  puffyButtons?: boolean,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const ConfirmationDialogBase = ({
  cancelButtonText,
  cancelButtonType = 'cancel',
  className,
  confirmButtonText,
  confirmButtonType = 'alert',
  i18n,
  onCancel,
  onConfirm,
  message,
  puffyButtons,
}: InternalProps) => {
  return (
    <div className={makeClassName('ConfirmationDialog', className)}>
      {message && <span className="ConfirmationDialog-message">{message}</span>}
      <div className="ConfirmationDialog-buttons">
        <Button
          buttonType={confirmButtonType}
          className="ConfirmationDialog-confirm-button"
          onClick={onConfirm}
          puffy={puffyButtons}
        >
          {confirmButtonText || i18n.gettext('Confirm')}
        </Button>
        <Button
          buttonType={cancelButtonType}
          className="ConfirmationDialog-cancel-button"
          onClick={onCancel}
          puffy={puffyButtons}
        >
          {cancelButtonText || i18n.gettext('Cancel')}
        </Button>
      </div>
    </div>
  );
};

const ConfirmationDialog: React.ComponentType<Props> = compose(translate())(
  ConfirmationDialogBase,
);

export default ConfirmationDialog;
