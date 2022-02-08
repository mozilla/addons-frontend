import * as React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getPromotedBadgesLinkUrl } from 'amo/utils';
import {
  createFakeEvent,
  fakeI18n,
  render as defaultRender,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import IconPromotedBadge from 'amo/components/IconPromotedBadge';
import PromotedBadge, { PromotedBadgeBase } from 'amo/components/PromotedBadge';

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
  const renderEnzyme = (moreProps = {}) => {
    const props = {
      category: 'line',
      i18n: fakeI18n(),
      size: 'large',
      ...moreProps,
    };
    return shallowUntilTarget(<PromotedBadge {...props} />, PromotedBadgeBase);
  };

  function render(props) {
    const allProps = {
      category: 'line',
      size: 'large',
      ...props,
    };

    return defaultRender(<PromotedBadge {...allProps} />);
  }

  it.each([
    ['PromotedBadge-large', 'large'],
    ['PromotedBadge-small', 'small'],
  ])('adds the class "%s" for size="%s"', (className, size) => {
    const root = renderEnzyme({ size });

    expect(root).toHaveClassName(className);
  });

  it.each([
    ['PromotedBadge-large', 'large'],
    ['PromotedBadge-small', 'small'],
  ])('adds the class "%s" for size="%s" RTL', (className, size) => {
    const { root } = render({ size });

    expect(root).toHaveClass(className);
  });

  it.each([
    [
      'line',
      'Official add-on built by Mozilla Firefox. Meets security and performance standards.',
    ],
    [
      'recommended',
      'Firefox only recommends add-ons that meet our standards for security and performance.',
    ],
    [
      'verified',
      'This add-on has been reviewed to meet our standards for security and performance.',
    ],
  ])(
    'passes the expected props to the link for category="%s"',
    (category, linkTitle) => {
      const root = renderEnzyme({ category });

      expect(root.find('.PromotedBadge-link')).toHaveProp('title', linkTitle);
      expect(root.find('.PromotedBadge-link')).toHaveProp(
        'href',
        getPromotedBadgesLinkUrl({
          utm_content: 'promoted-addon-badge',
        }),
      );
    },
  );

  it.each([
    [
      'line',
      'Official add-on built by Mozilla Firefox. Meets security and performance standards.',
    ],
    [
      'recommended',
      'Firefox only recommends add-ons that meet our standards for security and performance.',
    ],
    [
      'verified',
      'This add-on has been reviewed to meet our standards for security and performance.',
    ],
  ])(
    'uses the expected attributes for the link for category="%s" RTL',
    (category, linkTitle) => {
      render({ category });

      expect(screen.getByRole('link')).toHaveAttribute('title', linkTitle);
      expect(screen.getByRole('link')).toHaveAttribute(
        'href',
        getPromotedBadgesLinkUrl({
          utm_content: 'promoted-addon-badge',
        }),
      );
    },
  );

  it.each(['line', 'recommended', 'verified'])(
    'adds the expected classes for category="%s"',
    (category) => {
      const root = renderEnzyme({ category });

      expect(root.find('.PromotedBadge')).toHaveClassName(
        `PromotedBadge--${category}`,
      );
      expect(root.find('.PromotedBadge-link')).toHaveClassName(
        `PromotedBadge-link--${category}`,
      );
      expect(root.find('.PromotedBadge-label')).toHaveClassName(
        `PromotedBadge-label--${category}`,
      );
    },
  );

  it.each([
    ['line', 'By Firefox'],
    ['recommended', 'Recommended'],
    ['verified', 'Verified'],
  ])('adds the expected classes for category="%s" RTL', (category, label) => {
    const { root } = render({ category });

    expect(root).toHaveClass(`PromotedBadge--${category}`);
    expect(screen.getByRole('link')).toHaveClass(
      `PromotedBadge-link--${category}`,
    );
    expect(screen.getByText(label)).toHaveClass(
      `PromotedBadge-label--${category}`,
    );
  });

  it.each([
    ['line', 'By Firefox'],
    ['recommended', 'Recommended'],
    ['verified', 'Verified'],
  ])('uses the expected label for category="%s"', (category, label) => {
    const root = renderEnzyme({ category });

    expect(root.find('.PromotedBadge-label')).toHaveText(label);
  });

  it.each([
    ['line', 'By Firefox'],
    ['recommended', 'Recommended'],
    ['verified', 'Verified'],
  ])('uses the expected label for category="%s" RTL', (category, label) => {
    render({ category });

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('calls onClick after clicking on the link', () => {
    const clickEvent = createFakeEvent();
    const onClick = sinon.spy();
    const root = renderEnzyme({ onClick });
    root.find('.PromotedBadge-link').simulate('click', clickEvent);

    sinon.assert.calledWith(onClick, clickEvent);
  });

  it('calls onClick after clicking on the link RTL', async () => {
    const onClick = jest.fn();
    render({ onClick });
    userEvent.click(screen.getByRole('link'));

    expect(onClick).toHaveBeenCalled();
  });

  it('passes a category and size to IconPromotedBadge', () => {
    const category = 'verified';
    const size = 'large';
    const root = renderEnzyme({ category, size });

    expect(root.find(IconPromotedBadge)).toHaveProp('category', category);
    expect(root.find(IconPromotedBadge)).toHaveProp('size', size);
  });

  // TODO: Here is an example where this test has to understand the
  // output of the IconPromotedBadge component.
  it('passes a category and size to IconPromotedBadge RTL', () => {
    const category = 'verified';
    const size = 'large';
    const { getByClassName } = render({ category, size });

    expect(getByClassName('Icon')).toHaveClass('IconPromotedBadge-large');
    expect(getByClassName('IconPromotedBadge-iconPath')).toHaveClass(
      `IconPromotedBadge-iconPath--${category}`,
    );
  });

  // See https://github.com/mozilla/addons-frontend/issues/8285.
  it('does not pass an alt property to IconPromotedBadge', () => {
    const root = renderEnzyme();

    expect(root.find(IconPromotedBadge)).not.toHaveProp('alt');
  });

  // TODO: Here we need to understand the output of the Icon component,
  // which itself is embedded inside the IconPromotedBadge component.
  // See https://github.com/mozilla/addons-frontend/issues/8285.
  it('does not pass an alt property to IconPromotedBadge RTL', () => {
    const { getByClassName } = render();

    // IconPromotedBadge will render a <span> with a class of
    // 'visually-hidden' if an `alt` prop was passed.
    expect(getByClassName('visually-hidden')).toBeNull();
  });
});
