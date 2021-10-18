/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import Link from 'amo/components/Link';
import { reviewListURL } from 'amo/reducers/reviews';
import translate from 'amo/i18n/translate';
import LoadingText from 'amo/components/LoadingText';
import IconStar from 'amo/components/IconStar';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterLocationType } from 'amo/types/router';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  location: ReactRouterLocationType,
|};

export class RatingsByStarBase extends React.Component<InternalProps> {
  renderBarValue(starCount: number): React.Node {
    const { addon } = this.props;
    invariant(addon, 'addon is required');

    let width = 0;
    if (addon.ratings && addon.ratings.count > 0) {
      width = Math.round((starCount / addon.ratings.count) * 100);
    }

    return (
      <div
        className={makeClassName(
          'RatingsByStar-bar',
          'RatingsByStar-barValue',
          `RatingsByStar-barValue--${width}pct`,
          {
            'RatingsByStar-partialBar': width < 100,
          },
        )}
      />
    );
  }

  render(): React.Node {
    const { addon, i18n, location } = this.props;
    const loading = !addon;

    const getLinkTitles = (rating, total) => {
      const ratings = {
        '5': 'five',
        '4': 'four',
        '3': 'three',
        '2': 'two',
        '1': 'one',
      };

      const countText = total && total > 1 ? `all ${total}` : 'the';
      const reviewText = total && total > 1 ? 'reviews' : 'review';

      /* eslint-disable quote-props */
      if (total && total > 0) {
        return i18n.gettext(
          `Read ${countText} ${ratings[rating]}-star ${reviewText}`,
        );
      }
      return i18n.gettext(`No ${ratings[rating]}-star reviews yet`);
      /* eslint-enable quote-props */
    };

    return (
      <div className="RatingsByStar">
        <div className="RatingsByStar-graph">
          {['5', '4', '3', '2', '1'].map((star) => {
            let starCount;

            function createLink(text) {
              invariant(addon, 'addon was unexpectedly empty');

              return (
                <Link
                  className="RatingsByStar-row"
                  key={star}
                  title={getLinkTitles(star, starCount) || ''}
                  to={reviewListURL({
                    addonSlug: addon.slug,
                    score: star,
                    location,
                  })}
                >
                  {text}
                </Link>
              );
            }

            if (addon && addon.ratings) {
              starCount = addon.ratings.grouped_counts[star];
            }

            const loadingRow = (
              <div key={star} className="RatingsByStar-row">
                <div className="RatingsByStar-star">
                  <LoadingText width={100} />
                  <IconStar selected />
                </div>

                <div className="RatingsByStar-barContainer">
                  <div className="RatingsByStar-bar RatingsByStar-barFrame" />
                </div>

                <div className="RatingsByStar-count">
                  <LoadingText width={100} />
                </div>
              </div>
            );

            const ratingsByStarRow = (
              <>
                <div className="RatingsByStar-star">
                  {i18n.formatNumber(star)}
                  <IconStar selected />
                </div>

                <div className="RatingsByStar-barContainer">
                  <div className="RatingsByStar-bar RatingsByStar-barFrame">
                    {starCount !== undefined
                      ? this.renderBarValue(starCount)
                      : null}
                  </div>
                </div>

                <div className="RatingsByStar-count">
                  {i18n.formatNumber(starCount || 0)}
                </div>
              </>
            );

            return loading ? loadingRow : createLink(ratingsByStarRow);
          })}
        </div>
      </div>
    );
  }
}

const RatingsByStar: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
)(RatingsByStarBase);

export default RatingsByStar;
