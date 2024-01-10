/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import type { I18nType } from 'amo/types/i18n';
import type { ButtonType } from 'amo/components/Button';
import type { HTMLElementEventHandler } from 'amo/types/dom';

import './styles.scss';

export type Props = {|
  cancelButtonText?: string | null,
  cancelButtonType?: ButtonType,
  className?: string,
  confirmButtonText?: string | null,
  confirmButtonType?: ButtonType,
  message?: string,
  onCancel: HTMLElementEventHandler,
  onConfirm: HTMLElementEventHandler,
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
}: InternalProps): React.Node => {
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
          {confirmButtonText || i18n.t('Confirm')}
        </Button>
        <Button
          buttonType={cancelButtonType}
          className="ConfirmationDialog-cancel-button"
          onClick={onCancel}
          puffy={puffyButtons}
        >
          {cancelButtonText || i18n.t('Cancel')}
        </Button>
      </div>
    </div>
  );
};

const ConfirmationDialog: React.ComponentType<Props> = compose(translate())(
  ConfirmationDialogBase,
);

export default ConfirmationDialog;
