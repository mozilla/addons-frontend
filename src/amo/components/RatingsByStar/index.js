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
  renderBarValue(starCount: number) {
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
          {
            'RatingsByStar-partialBar': width < 100,
          },
        )}
        style={{ width: `${width}%` }}
      />
    );
  }

  render() {
    const { addon, i18n, location } = this.props;
    const loading = !addon;

    const linkTitles = {
      /* eslint-disable quote-props */
      '5': i18n.gettext('Read all five-star reviews'),
      '4': i18n.gettext('Read all four-star reviews'),
      '3': i18n.gettext('Read all three-star reviews'),
      '2': i18n.gettext('Read all two-star reviews'),
      '1': i18n.gettext('Read all one-star reviews'),
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
                  title={linkTitles[star] || ''}
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

            const starCountNode = loading ? (
              <LoadingText width={100} />
            ) : (
              createLink(i18n.formatNumber(starCount || 0))
            );

            return (
              <React.Fragment key={star}>
                <div className="RatingsByStar-star">
                  {loading ? (
                    <LoadingText width={100} />
                  ) : (
                    createLink(i18n.formatNumber(star))
                  )}
                  <IconStar selected />
                </div>
                <div className="RatingsByStar-barContainer">
                  {loading ? (
                    <div className="RatingsByStar-bar RatingsByStar-barFrame" />
                  ) : (
                    createLink(
                      <div className="RatingsByStar-bar RatingsByStar-barFrame">
                        {starCount !== undefined
                          ? this.renderBarValue(starCount)
                          : null}
                      </div>,
                    )
                  )}
                </div>
                <div className="RatingsByStar-count">{starCountNode}</div>
              </React.Fragment>
            );
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
