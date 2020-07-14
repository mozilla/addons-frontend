import * as React from 'react';

import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import IconPromotedBadge from 'ui/components/IconPromotedBadge';
import PromotedBadge, { PromotedBadgeBase } from 'ui/components/PromotedBadge';

describe(__filename, () => {
  const render = (moreProps = {}) => {
    const props = {
      category: 'line',
      i18n: fakeI18n(),
      size: 'large',
      sponsor: false,
      ...moreProps,
    };
    return shallowUntilTarget(<PromotedBadge {...props} />, PromotedBadgeBase);
  };

  it.each([
    ['PromotedBadge-large', 'large'],
    ['PromotedBadge-small', 'small'],
  ])('adds the class "%s" for size="%s"', (className, size) => {
    const root = render({ size });

    expect(root).toHaveClassName(className);
  });

  it.each([
    [
      'line',
      'Firefox only recommends extensions that meet our standards for security and performance.',
      'https://support.mozilla.org/kb/recommended-extensions-program',
    ],
    [
      'recommended',
      'Firefox only recommends extensions that meet our standards for security and performance.',
      'https://support.mozilla.org/kb/recommended-extensions-program',
    ],
    [
      'verified',
      'Firefox only recommends extensions that meet our standards for security and performance.',
      'https://support.mozilla.org/kb/recommended-extensions-program',
    ],
  ])(
    'passes the expected props to the link for category="%s"',
    (category, linkTitle, linkUrl) => {
      const root = render({ category });

      expect(root.find('.PromotedBadge-link')).toHaveProp('title', linkTitle);
      expect(root.find('.PromotedBadge-link')).toHaveProp('href', linkUrl);
    },
  );

  it.each(['line', 'recommended', 'verified'])(
    'adds the expected classes for category="%s"',
    (category) => {
      const root = render({ category });

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
  ])('uses the expected label for category="%s"', (category, label) => {
    const root = render({ category });

    expect(root.find('.PromotedBadge-label')).toHaveText(label);
  });

  it('uses the expected label for verified sponsor', () => {
    const root = render({ category: 'verified', sponsor: true });

    expect(root.find('.PromotedBadge-label')).toHaveText('Verified Sponsor');
  });

  it('calls onClick after clicking on the link', () => {
    const clickEvent = createFakeEvent();
    const onClick = sinon.spy();
    const root = render({ onClick });
    root.find('.PromotedBadge-link').simulate('click', clickEvent);

    sinon.assert.calledWith(onClick, clickEvent);
  });

  it('passes a category and size to IconPromotedBadge', () => {
    const category = 'verified';
    const size = 'large';
    const root = render({ category, size });

    expect(root.find(IconPromotedBadge)).toHaveProp('category', category);
    expect(root.find(IconPromotedBadge)).toHaveProp('size', size);
  });

  // See https://github.com/mozilla/addons-frontend/issues/8285.
  it('does not pass an alt property to IconPromotedBadge', () => {
    const root = render();

    expect(root.find(IconPromotedBadge)).not.toHaveProp('alt');
  });
});
