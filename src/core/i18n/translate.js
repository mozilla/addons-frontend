import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { makeI18n } from 'core/i18n/utils';


function getDisplayName(component) {
  return component.displayName || component.name || 'Component';
}

export default function translate(options = {}) {
  const { withRef = false } = options;

  return function Wrapper(WrappedComponent) {
    class Translate extends Component {
      getWrappedInstance() {
        if (!withRef) {
          throw new Error(dedent`To access the wrapped instance, you need to specify
            { withRef: true } as the second argument of the translate() call.`);
        }
        return this.wrappedInstance;
      }

      render() {
        const extraProps = { i18n: this.i18n };

        if (withRef) {
          extraProps.ref = (ref) => { this.wrappedInstance = ref; };
        }

        return <WrappedComponent {...extraProps} {...this.props} />;
      }
    }

    Translate.WrappedComponent = WrappedComponent;

    Translate.contextTypes = {
      i18n: PropTypes.object.isRequired,
    };

    Translate.childContextTypes = {
      i18n: PropTypes.object.isRequired,
    };

    Translate.displayName = `Translate[${getDisplayName(WrappedComponent)}]`;

    function mapStateToProps({ api, i18n }) {
      return {
        i18n: makeI18n(i18n, api.lang),
      };
    }

    return connect(mapStateToProps)(Translate);
  };
}
