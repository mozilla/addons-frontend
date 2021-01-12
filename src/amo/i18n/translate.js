/* @flow */
import * as React from 'react';
import PropTypes from 'prop-types';

import { getDisplayName } from 'amo/utils';
import type { I18nType } from 'amo/types/i18n';

type Context = {|
  i18n: I18nType,
|};

const translate = (): ((
  React.ComponentType<any>,
) => React.ComponentType<any>) => {
  return (WrappedComponent) => {
    class Translate extends React.Component<any> {
      i18n: I18nType;

      static contextTypes: Context = {
        i18n: PropTypes.object,
      };

      static displayName = `Translate(${getDisplayName(WrappedComponent)})`;

      constructor(props: Object, context: Context) {
        super(props, context);

        this.i18n = context.i18n;
      }

      render() {
        return <WrappedComponent i18n={this.i18n} {...this.props} />;
      }
    }

    return Translate;
  };
};

export default translate;
