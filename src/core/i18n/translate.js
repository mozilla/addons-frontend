import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { oneLine } from 'common-tags';

function getDisplayName(component) {
  return component.displayName || component.name || 'Component';
}

export default function translate(options = {}) {
  const { withRef = false } = options;

  return function Wrapper(WrappedComponent) {
    class Translate extends Component {
      constructor(props, context) {
        super(props, context);
        this.i18n = context.i18n;
      }

      getWrappedInstance() {
        if (!withRef) {
          throw new Error(oneLine`To access the wrapped instance, you need to specify
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

    return Translate;
  };
}
