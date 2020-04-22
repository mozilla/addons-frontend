/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import Link from 'amo/components/Link';
import { fetchGroupedRatings } from 'amo/actions/reviews';
import { reviewListURL } from 'amo/reducers/reviews';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import LoadingText from 'ui/components/LoadingText';
import IconStar from 'ui/components/IconStar';
import type { GroupedRatingsType } from 'amo/api/reviews';
import type { AppState } from 'amo/store';
import type { AddonType } from 'core/types/addons';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
|};

type InternalProps = {|
  ...Props,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  groupedRatings?: GroupedRatingsType,
  i18n: I18nType,
  location: ReactRouterLocationType,
|};

export class RatingsByStarBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    // TODO: this is intended to load on the server (before mount) but it
    // does not.
    // See: https://github.com/mozilla/addons-frontend/issues/5854
    this.loadDataIfNeeded();
  }

  componentDidUpdate() {
    this.loadDataIfNeeded();
  }

  loadDataIfNeeded() {
    const { addon, dispatch, errorHandler, groupedRatings } = this.props;

    if (!errorHandler.hasError() && addon && !groupedRatings) {
      dispatch(
        fetchGroupedRatings({
          addonId: addon.id,
          errorHandlerId: errorHandler.id,
        }),
      );
    }
  }

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
    const { addon, errorHandler, i18n, groupedRatings, location } = this.props;
    const loading = (!addon || !groupedRatings) && !errorHandler.hasError();

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
        {errorHandler.renderErrorIfPresent()}
        <div className="RatingsByStar-graph">
          {['5', '4', '3', '2', '1'].map((star) => {
            let starCount;
            let starCountNode;

            function createLink(text) {
              invariant(addon, 'addon was unexpectedly empty');

              return (
                <Link
                  title={linkTitles[star] || ''}
                  to={reviewListURL({
                    addonSlug: addon.slug,
                    score: star,
                    src: location.query.src,
                  })}
                >
                  {text}
                </Link>
              );
            }

            if (!errorHandler.hasError()) {
              if (groupedRatings) {
                starCount = groupedRatings[star];
              }

              starCountNode = loading ? (
                <LoadingText minWidth={95} />
              ) : (
                createLink(i18n.formatNumber(starCount || 0))
              );
            }

            return (
              <React.Fragment key={star}>
                <div className="RatingsByStar-star">
                  {loading ? (
                    <LoadingText minWidth={95} />
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

const mapStateToProps = (state: AppState, ownProps: Props) => {
  let groupedRatings;
  if (ownProps.addon) {
    groupedRatings = state.reviews.groupedRatings[ownProps.addon.id];
  }
  return {
    groupedRatings,
  };
};

export const extractId = (props: Props) => {
  const { addon } = props;
  return addon ? `addon-${addon.id.toString()}` : '';
};

const RatingsByStar: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(RatingsByStarBase);

export default RatingsByStar;
