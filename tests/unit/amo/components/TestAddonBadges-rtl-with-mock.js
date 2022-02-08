import * as React from 'react';
import { Provider } from 'react-redux';

import AddonBadges from 'amo/components/AddonBadges';
import { CLIENT_APP_FIREFOX, RECOMMENDED } from 'amo/constants';
import {
  createInternalAddonWithLang,
  createFakeAddon,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  render as defaultRender,
} from 'tests/unit/helpers';
import Badge from 'amo/components/Badge';
import PromotedBadge from 'amo/components/PromotedBadge';

jest.mock('amo/i18n/translate', () => {
  /* eslint-disable no-shadow */
  /* eslint-disable global-require */
  const React = require('react');
  const { fakeI18n } = require('tests/unit/helpers');
  /* eslint-enable no-shadow */
  /* eslint-enable global-require */
  return {
    __esModule: true,
    default: () => {
      return (WrappedComponent) => {
        class Translate extends React.Component<any> {
          constructor(props) {
            super(props);

            this.i18n = fakeI18n();
          }

          render() {
            return <WrappedComponent i18n={this.i18n} {...this.props} />;
          }
        }

        return Translate;
      };
    },
  };
});

jest.mock('amo/components/PromotedBadge', () => {
  return jest.fn(() => null);
});

jest.mock('amo/components/Badge', () => {
  return jest.fn(() => null);
});

describe(__filename, () => {
  function render(props) {
    const allProps = {
      i18n: fakeI18n(),
      store: dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX }).store,
      ...props,
    };

    return defaultRender(
      <Provider store={allProps.store}>
        <AddonBadges {...allProps} />
      </Provider>,
    );
  }

  it('displays a promoted badge for a promoted add-on', () => {
    const category = RECOMMENDED;
    const _getPromotedCategory = sinon.stub().returns(category);

    render({
      _getPromotedCategory,
      addon: createInternalAddonWithLang(fakeAddon),
    });
    // The extra empty object is the context passed to the component.
    // I could create a matcher like toHaveProp which encapsulates this.
    expect(PromotedBadge).toHaveBeenCalledWith(
      expect.objectContaining({ category }),
      {},
    );
  });

  it('displays a badge when the addon is experimental', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        is_experimental: true,
      }),
    );
    render({ addon });

    expect(Badge).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'experimental', label: 'Experimental' }),
      {},
    );
  });
});
