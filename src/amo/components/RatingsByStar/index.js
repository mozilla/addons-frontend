/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { fetchGroupedRatings } from 'amo/actions/reviews';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import LoadingText from 'ui/components/LoadingText';
import Icon from 'ui/components/Icon';
import type { GroupedRatingsType } from 'amo/api/reviews';
import type { AppState } from 'amo/store';
import type { AddonType } from 'core/types/addons';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';

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
|};

export class RatingsByStarBase extends React.Component<InternalProps> {
  componentWillMount() {
    this.loadDataIfNeeded(this.props);
  }

  componentWillReceiveProps(nextProps: InternalProps) {
    this.loadDataIfNeeded(nextProps);
  }

  loadDataIfNeeded(props: InternalProps) {
    const { addon, dispatch, errorHandler, groupedRatings } = props;
    if (addon && !groupedRatings) {
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
            'RatingsByStar-barValueLessThan100': width < 100,
          },
        )}
        style={{ width: `${width}%` }}
      />
    );
  }

  render() {
    const { addon, errorHandler, i18n, groupedRatings } = this.props;
    const loading = !addon || !groupedRatings;

    // TODO: handle 404 API response?
    // TODO: render errors
    return (
      <div className="RatingsByStar">
        {errorHandler.renderErrorIfPresent()}
        {[5, 4, 3, 2, 1].map((star) => {
          let starCount;
          if (groupedRatings) {
            starCount = groupedRatings[star];
          }

          return (
            <React.Fragment key={star}>
              <div className="RatingsByStar-star">
                <span>{star}</span>
                <Icon name="star-active" />
              </div>
              <div className="RatingsByStar-barContainer">
                <div className="RatingsByStar-bar RatingsByStar-barFrame">
                  {starCount !== undefined
                    ? this.renderBarValue(starCount)
                    : null}
                </div>
              </div>
              <div className="RatingsByStar-count">
                {loading ? (
                  <LoadingText minWidth={95} />
                ) : (
                  i18n.formatNumber(starCount || 0)
                )}
              </div>
            </React.Fragment>
          );
        })}
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
  translate(),
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(RatingsByStarBase);

export default RatingsByStar;
