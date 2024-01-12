/* @flow */
import * as React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { getDisplayName } from 'amo/utils';
import type { I18nType, I18nextType } from 'amo/types/i18n';

type Context = {|
  jed: I18nType,
|};

const translate = (): ((
  React.ComponentType<any>,
) => React.ComponentType<{ i18n: I18nextType }>) => {
  return (WrappedComponent) => {
    class Translate extends React.Component<any> {
      jed: I18nType;

      static contextTypes: Context = {
        jed: PropTypes.object,
      };

      static displayName = `Translate(${getDisplayName(WrappedComponent)})`;

      constructor(props: Object, context: Context) {
        super(props, context);

        this.jed = context.jed;
      }

      render() {
        return <WrappedComponent jed={this.jed} {...this.props} />;
      }
    }

    // THIS might not be working... could be replacing the i18n object.
    // We might need to rename the old i18n across the code base if we can't sort it.
    return withTranslation()(Translate);
  };
};

export default translate;
