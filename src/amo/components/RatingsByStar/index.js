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
      switch (rating) {
        /* eslint-disable quote-props */
        case '5':
          if (total && total > 0) {
            return i18n.sprintf(
              i18n.ngettext(
                'Read the 1 five-star review',
                'Read all %(total)s five-star reviews',
                total,
              ),
              {
                total: i18n.formatNumber(total || 0),
              },
            );
          }
          return i18n.gettext('There are no five-star reviews');

        case '4':
          if (total && total > 0) {
            return i18n.sprintf(
              i18n.ngettext(
                'Read the 1 four-star review',
                'Read all %(total)s four-star reviews',
                total,
              ),
              {
                total: i18n.formatNumber(total || 0),
              },
            );
          }
          return i18n.gettext('There are no four-star reviews');

        case '3':
          if (total && total > 0) {
            return i18n.sprintf(
              i18n.ngettext(
                'Read the 1 three-star review',
                'Read all %(total)s three-star reviews',
                total,
              ),
              {
                total: i18n.formatNumber(total || 0),
              },
            );
          }
          return i18n.gettext('There are no three-star reviews');

        case '2':
          if (total && total > 0) {
            return i18n.sprintf(
              i18n.ngettext(
                'Read the 1 two-star review',
                'Read all %(total)s two-star reviews',
                total,
              ),
              {
                total: i18n.formatNumber(total || 0),
              },
            );
          }
          return i18n.gettext('There are no two-star reviews');

        case '1':
          if (total && total > 0) {
            return i18n.sprintf(
              i18n.ngettext(
                'Read the 1 one-star review',
                'Read all %(total)s one-star reviews',
                total,
              ),
              {
                total: i18n.formatNumber(total || 0),
              },
            );
          }
          return i18n.gettext('There are no one-star reviews');

        default:
          return i18n.gettext('There are no reviews');
        /* eslint-enable quote-props */
      }
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
