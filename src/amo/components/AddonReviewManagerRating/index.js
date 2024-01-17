/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import Rating from 'amo/components/Rating';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export type Props = {|
  children?: React.Node | string,
  className?: string,
  onSelectRating: ((score: number) => void) | void,
  rating: ?number,
|};

type InternalProps = {|
  ...Props,
  jed: I18nType,
|};

export const AddonReviewManagerRatingBase = ({
  children,
  className,
  jed,
  onSelectRating,
  rating,
}: InternalProps): React.Node => {
  const readOnly = !onSelectRating;

  return (
    <div className={makeClassName('AddonReviewManagerRating', className)}>
      <span>{jed.gettext('Your star rating:')}</span>
      <Rating
        onSelectRating={onSelectRating}
        rating={rating}
        readOnly={readOnly}
        styleSize="small"
        yellowStars
      />
      {children}
    </div>
  );
};

const AddonReviewManagerRating: React.ComponentType<Props> = compose(
  translate(),
)(AddonReviewManagerRatingBase);

export default AddonReviewManagerRating;
