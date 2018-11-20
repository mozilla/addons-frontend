/* @flow */
import * as React from 'react';

import translate from 'core/i18n/translate';
import Notice from 'ui/components/Notice';
import { getErrorMessage } from 'core/utils/addons';
import type { I18nType } from 'core/types/i18n';

type Props = {|
  error: string | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const AddonInstallErrorBase = ({ error, i18n }: InternalProps) => {
  if (!error) {
    return null;
  }

  return (
    <Notice className="Addon-header-install-error" type="error">
      {getErrorMessage({ i18n, error })}
    </Notice>
  );
};

const AddonInstallError: React.ComponentType<InternalProps> = translate()(
  AddonInstallErrorBase,
);

export default AddonInstallError;
