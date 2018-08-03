/* @flow */
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

class RatingsByStarBase extends React.Component<InternalProps> {
  componentWillMount() {
    const { addon, dispatch, errorHandler, groupedRatings } = this.props;
    if (addon && !groupedRatings) {
      dispatch(
        fetchGroupedRatings({
          addonId: addon.id,
          errorHandlerId: errorHandler.id,
        }),
      );
    }
  }

  render() {
    const { addon, groupedRatings } = this.props;
    const loading = !addon || !groupedRatings;

    // TODO: handle 404 API response?
    // TODO: render errors
    return (
      <div className="RatingsByStar">
        {[5, 4, 3, 2, 1].map((star) => (
          <React.Fragment>
            <div className="RatingsByStar-star">
              {star}
              <Icon name="star-active" />
            </div>
            <div className="RatingsByStar-barContainer">
              <div className="RatingsByStar-bar" />
            </div>
            <div className="RatingsByStar-count">
              {/* TODO: localize number */}
              {loading ? <LoadingText minWidth={95} /> : groupedRatings[star]}
            </div>
          </React.Fragment>
        ))}
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

const extractId = (props: Props) => {
  const { addon } = props;
  return addon ? addon.id.toString() : '';
};

const RatingsByStar: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(RatingsByStarBase);

export default RatingsByStar;
