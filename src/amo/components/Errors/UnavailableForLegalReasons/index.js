/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import ErrorComponent from 'amo/components/Errors/ErrorComponent';
import translate from 'core/i18n/translate';
import type { I18nType } from 'core/types/i18n';

type Props = {||};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class UnavailableForLegalReasonsBase extends React.Component<InternalProps> {
  render() {
    const { i18n } = this.props;

    return (
      <ErrorComponent
        code={451}
        header={i18n.gettext('Unavailable for legal reasons')}
      >
        <p>
          {i18n.gettext(
            'Sorry, but the content you are seeking is not available in your region.',
          )}
        </p>
      </ErrorComponent>
    );
  }
}

const UnavailableForLegalReasons: React.ComponentType<Props> = compose(
  translate(),
)(UnavailableForLegalReasonsBase);

export default UnavailableForLegalReasons;
