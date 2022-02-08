import * as React from 'react';
import { Provider } from 'react-redux';
import { screen } from '@testing-library/react';

import AddonBadges, { AddonBadgesBase } from 'amo/components/AddonBadges';
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_FIREFOX,
  RECOMMENDED,
} from 'amo/constants';
import {
  createInternalAddonWithLang,
  createFakeAddon,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  render as defaultRender,
  shallowUntilTarget,
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

describe(__filename, () => {
  function shallowRender(props) {
    const allProps = {
      i18n: fakeI18n(),
      store: dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX }).store,
      ...props,
    };

    return shallowUntilTarget(<AddonBadges {...allProps} />, AddonBadgesBase);
  }

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

  it('returns null when there is no add-on', () => {
    const root = shallowRender({ addon: null });
    expect(root.html()).toEqual(null);
  });

  it('returns null when there is no add-on RTL', () => {
    const { root } = render({ addon: null });
    expect(root).toEqual(null);
  });

  it('displays no badges when none are called for', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_EXTENSION,
    });
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveLength(0);
  });

  // TODO: This requires us to know that any badges will be
  // rendered as divs with a className of 'Badge'.
  it('displays no badges when none are called for RTL', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_EXTENSION,
    });
    const { queryByClassName } = render({ addon });

    expect(queryByClassName('Badge')).toHaveLength(0);
  });

  it('displays a promoted badge for a promoted add-on', () => {
    const category = RECOMMENDED;
    const _getPromotedCategory = sinon.stub().returns(category);

    const root = shallowRender({
      _getPromotedCategory,
      addon: createInternalAddonWithLang(fakeAddon),
    });

    expect(root.find(PromotedBadge)).toHaveLength(1);
    expect(root.find(PromotedBadge)).toHaveProp('category', category);
  });

  // TODO: This requires us to know that the PromotedBadge component
  // renders the text "Recommended".
  it('displays a promoted badge for a promoted add-on RTL', () => {
    const category = RECOMMENDED;
    const _getPromotedCategory = sinon.stub().returns(category);

    const { getByClassName } = render({
      _getPromotedCategory,
      addon: createInternalAddonWithLang(fakeAddon),
    });

    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(getByClassName('PromotedBadge-large')).toBeInTheDocument();
  });

  it('does not display a promoted badge for a non-promoted addon', () => {
    const _getPromotedCategory = sinon.stub().returns(null);

    const root = shallowRender({
      _getPromotedCategory,
      addon: createInternalAddonWithLang(fakeAddon),
    });

    expect(root.find(PromotedBadge)).toHaveLength(0);
  });

  it('does not display a promoted badge for a non-promoted addon RTL', () => {
    const _getPromotedCategory = sinon.stub().returns(null);

    render({
      _getPromotedCategory,
      addon: createInternalAddonWithLang(fakeAddon),
    });

    expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
  });

  it('displays a badge when the addon is experimental', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        is_experimental: true,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'experimental');
    expect(root.find(Badge)).toHaveProp('label', 'Experimental');
  });

  it('displays a badge when the addon is experimental RTL', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        is_experimental: true,
      }),
    );
    const { getByClassName } = render({ addon });

    // The text "Experimental" appears in the document twice for this badge.
    expect(screen.getAllByText('Experimental')).toHaveLength(2);
    expect(getByClassName('Badge-experimental')).toBeInTheDocument();
  });

  it('does not display a badge when the addon is not experimental', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        is_experimental: false,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge).find({ type: 'experimental' })).toHaveLength(0);
  });

  it('does not display a badge when the addon is not experimental RTL', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        is_experimental: false,
      }),
    );
    render({ addon });

    expect(screen.queryByText('Experimental')).not.toBeInTheDocument();
  });

  it('displays a badge when the addon requires payment', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        requires_payment: true,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'requires-payment');
    expect(root.find(Badge)).toHaveProp(
      'label',
      'Some features may require payment',
    );
  });

  it('displays a badge when the addon requires payment RTL', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        requires_payment: true,
      }),
    );
    const { getByClassName } = render({ addon });
    screen.debug();
    // The expected text appears in the document twice for this badge.
    expect(
      screen.getAllByText('Some features may require payment'),
    ).toHaveLength(2);
    expect(getByClassName('Badge-requires-payment')).toBeInTheDocument();
  });

  it('does not display a badge when the addon does not require payment', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        requires_payment: false,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge).find({ type: 'requires-payment' })).toHaveLength(0);
  });

  it('does not display a badge when the addon does not require payment RTL', () => {
    const addon = createInternalAddonWithLang(
      createFakeAddon({
        requires_payment: false,
      }),
    );
    render({ addon });

    expect(
      screen.queryByText('Some features may require payment'),
    ).not.toBeInTheDocument();
  });
});
