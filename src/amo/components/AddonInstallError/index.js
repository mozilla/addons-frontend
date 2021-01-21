/* @flow */
import * as React from 'react';

import translate from 'amo/i18n/translate';
import Notice from 'amo/components/Notice';
import { getErrorMessage } from 'amo/utils/addons';
import type { I18nType } from 'amo/types/i18n';

import './style.scss';

type Props = {|
  error: string | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const AddonInstallErrorBase = (props: InternalProps): null | React.Node => {
  const { error, i18n } = props;
  if (!error) {
    return null;
  }

  return (
    <Notice className="AddonInstallError" type="error">
      {getErrorMessage({ i18n, error })}
    </Notice>
  );
};

const AddonInstallError: React.ComponentType<Props> = translate()(
  AddonInstallErrorBase,
);

export default AddonInstallError;
