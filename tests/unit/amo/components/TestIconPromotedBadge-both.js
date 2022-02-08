import * as React from 'react';
import { screen } from '@testing-library/react';

import {
  fakeI18n,
  render as defaultRender,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Icon from 'amo/components/Icon';
import IconPromotedBadge, {
  IconPromotedBadgeBase,
  paths,
} from 'amo/components/IconPromotedBadge';

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
  const render = (moreProps = {}) => {
    const props = {
      category: 'line',
      i18n: fakeI18n(),
      size: 'large',
      ...moreProps,
    };
    return shallowUntilTarget(
      <IconPromotedBadge {...props} />,
      IconPromotedBadgeBase,
    );
  };

  function renderRTL(props) {
    const allProps = {
      category: 'line',
      size: 'large',
      ...props,
    };

    return defaultRender(<IconPromotedBadge {...allProps} />);
  }

  it.each([
    ['IconPromotedBadge-large', 'large'],
    ['IconPromotedBadge-small', 'small'],
  ])('adds the class "%s" for size="%s"', (className, size) => {
    const root = render({ size });

    expect(root).toHaveClassName(className);
  });

  it.each([
    ['IconPromotedBadge-large', 'large'],
    ['IconPromotedBadge-small', 'small'],
  ])('adds the class "%s" for size="%s" RTL', (className, size) => {
    const { root } = renderRTL({ size });

    expect(root).toHaveClass(className);
  });

  it.each(['recommended', 'verified'])(
    'adds the expected classes for category="%s"',
    (category) => {
      const root = render({ category });

      expect(root.find('circle').at(0)).toHaveClassName(
        `IconPromotedBadge-circle-bgColor--${category}`,
      );
      expect(root.find('path')).toHaveClassName(
        `IconPromotedBadge-iconPath--${category}`,
      );
    },
  );

  it.each(['recommended', 'verified'])(
    'adds the expected classes for category="%s" RTL',
    (category) => {
      const { getByTagName } = renderRTL({ category });

      expect(getByTagName('circle')).toHaveClass(
        `IconPromotedBadge-circle-bgColor--${category}`,
      );
      expect(getByTagName('path')).toHaveClass(
        `IconPromotedBadge-iconPath--${category}`,
      );
    },
  );

  it.each(['recommended', 'verified'])(
    'uses the expected path for category="%s"',
    (category) => {
      const root = render({ category });

      expect(root.find('path')).toHaveProp('d', paths[category]);
    },
  );

  it.each(['recommended', 'verified'])(
    'uses the expected path for category="%s" RTL',
    (category) => {
      const { getByTagName } = renderRTL({ category });

      expect(getByTagName('path')).toHaveAttribute('d', paths[category]);
    },
  );

  it('adds a custom class', () => {
    const className = 'MyCoolBadge';
    const root = render({ className });

    expect(root).toHaveClassName(className);
  });

  it('adds a custom class RTL', () => {
    const className = 'MyCoolBadge';
    const { root } = renderRTL({ className });

    expect(root).toHaveClass(className);
  });

  it.each([
    ['line', 'By Firefox'],
    ['recommended', 'Recommended'],
    ['verified', 'Verified'],
  ])(
    'adds an alt property for category="%s" when showAlt is true',
    (category, alt) => {
      const root = render({ category, showAlt: true });

      expect(root.find(Icon)).toHaveProp('alt', alt);
    },
  );

  it.each([
    ['line', 'By Firefox'],
    ['recommended', 'Recommended'],
    ['verified', 'Verified'],
  ])(
    'adds an alt property for category="%s" when showAlt is true RTL',
    (category, alt) => {
      renderRTL({ category, showAlt: true });

      expect(screen.getByText(alt)).toBeInTheDocument();
    },
  );

  it('does not add an alt property showAlt is false', () => {
    const root = render({ showAlt: false });

    expect(root.find(Icon)).toHaveProp('alt', undefined);
  });

  // TODO: Here is a difference.
  it('does not add an alt property showAlt is false RTL', () => {
    const { getByClassName } = renderRTL({ showAlt: false });

    // Icon will render a <span> with a class of
    // 'visually-hidden' if an `alt` prop was passed.
    expect(getByClassName('visually-hidden')).toBeNull();
  });

  it.each(['recommended', 'verified'])(
    'sets the icon with category="%s" to inline content',
    (category) => {
      const root = render({ category });

      expect(root).toHaveProp('name', 'inline-content');
    },
  );

  it.each(['recommended', 'verified'])(
    'sets the icon with category="%s" to inline content RTL',
    (category) => {
      const { root } = renderRTL({ category });

      expect(root).toHaveClass('Icon-inline-content');
    },
  );

  it('does not use inline-content but a real icon (image) for the category="line"', () => {
    const root = render({ category: 'line' });

    expect(root).toHaveProp('name', 'line');
  });

  it('does not use inline-content but a real icon (image) for the category="line" RTL', () => {
    const { root } = renderRTL({ category: 'line' });
    screen.debug();

    expect(root).toHaveClass('Icon-line');
  });
});
