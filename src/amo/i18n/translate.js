/* @flow */
import * as React from 'react';
import PropTypes from 'prop-types';

import { getDisplayName } from 'amo/utils';
import type { I18nType } from 'amo/types/i18n';

type Context = {|
  jed: I18nType,
|};

const translate = (): ((
  React.ComponentType<any>,
) => React.ComponentType<any>) => {
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

    return Translate;
  };
};

export default translate;
