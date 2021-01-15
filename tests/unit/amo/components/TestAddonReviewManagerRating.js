import * as React from 'react';

import AddonReviewManagerRating, {
  AddonReviewManagerRatingBase,
} from 'amo/components/AddonReviewManagerRating';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import Rating from 'amo/components/Rating';

describe(__filename, () => {
  function render(otherProps = {}) {
    const props = {
      onSelectRating: sinon.stub(),
      i18n: fakeI18n(),
      rating: null,
      ...otherProps,
    };

    return shallowUntilTarget(
      <AddonReviewManagerRating {...props} />,
      AddonReviewManagerRatingBase,
    );
  }

  it('lets you specify className', () => {
    const className = 'MyClass';
    const root = render({ className });

    expect(root).toHaveClassName(className);
    expect(root).toHaveClassName('AddonReviewManagerRating');
  });

  it('renders children', () => {
    const children = <span className="some-children" />;
    const root = render({ children });

    expect(root.find('.some-children')).toHaveLength(1);
  });

  it('passes rating to Rating', () => {
    const rating = 4;
    const root = render({ rating });

    expect(root.find(Rating)).toHaveProp('rating', rating);
  });

  it('passes onSelectRating to Rating', () => {
    const onSelectRating = sinon.stub();
    const root = render({ onSelectRating });

    expect(root.find(Rating)).toHaveProp('onSelectRating', onSelectRating);
  });

  it('sets readOnly correctly when onSelectRating is defined', () => {
    const root = render({ onSelectRating: sinon.stub() });

    expect(root.find(Rating)).toHaveProp('readOnly', false);
  });

  it('sets readOnly correctly when onSelectRating is undefined', () => {
    const root = render({ onSelectRating: undefined });

    expect(root.find(Rating)).toHaveProp('readOnly', true);
  });
});
