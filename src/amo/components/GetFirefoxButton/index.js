/* @flow */
import * as React from 'react';

import { makeQueryStringWithUTM } from 'amo/utils';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

export type Props = {|
  addon: AddonType,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const GetFirefoxButtonBase = (props: InternalProps) => {
  const { addon, i18n } = props;

  return (
    <Button
      buttonType="confirm"
      href={`https://www.mozilla.org/firefox/new/${makeQueryStringWithUTM({
        utm_content: addon.guid,
      })}`}
      puffy
      className="GetFirefoxButton"
    >
      {i18n.gettext('Only with Firefox—Get Firefox Now')}
    </Button>
  );
};

const GetFirefoxButton: React.ComponentType<Props> = translate()(
  GetFirefoxButtonBase,
);

export default GetFirefoxButton;
