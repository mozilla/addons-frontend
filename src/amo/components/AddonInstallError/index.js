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
  jed: I18nType,
|};

export const AddonInstallErrorBase = (
  props: InternalProps,
): null | React.Node => {
  const { error, jed } = props;
  if (!error) {
    return null;
  }

  return (
    <Notice className="AddonInstallError" type="error">
      {getErrorMessage({ jed, error })}
    </Notice>
  );
};

const AddonInstallError: React.ComponentType<Props> = translate()(
  AddonInstallErrorBase,
);

export default AddonInstallError;
