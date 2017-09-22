/* @flow */
/* eslint-disable react/sort-comp */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonReview from 'amo/components/AddonReview';
import translate from 'core/i18n/translate';
import { isAuthenticated } from 'core/reducers/user';
import { nl2br, sanitizeHTML } from 'core/utils';
import Button from 'ui/components/Button';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import type { UserReviewType } from 'amo/actions/reviews';
import type { UserStateType } from 'core/reducers/user';

import './styles.scss';

type PropsType = {|
  isAuthenticated: boolean,
  i18n: Object,
  review: UserReviewType,
  siteUser: UserStateType,
|};

export class AddonReviewListItemBase extends React.Component {
  props: PropsType;
  state: {| editingReview: boolean |};

  constructor(props: PropsType) {
    super(props);
    this.state = { editingReview: false };
  }

  onClickToEditReview = (event: SyntheticEvent) => {
    event.preventDefault();
    this.setState({ editingReview: true });
  }

  onEscapeReviewOverlay = () => {
    // Even though an escaped overlay will be hidden, we still have to
    // synchronize our show/hide state otherwise we won't be able to
    // show the overlay after it has been escaped.
    this.setState({ editingReview: false });
  }

  onReviewSubmitted = () => {
    this.setState({ editingReview: false });
  }

  render() {
    const {
      isAuthenticated: userIsAuthenticated, i18n, review, siteUser,
    } = this.props;

    let byLine;
    let reviewBody;
    if (review) {
      const timestamp = i18n.moment(review.created).fromNow();
      // L10n: Example: "from Jose, last week"
      byLine = i18n.sprintf(
        i18n.gettext('from %(authorName)s, %(timestamp)s'),
        { authorName: review.userName, timestamp });

      const reviewBodySanitized = sanitizeHTML(nl2br(review.body), ['br']);
      // eslint-disable-next-line react/no-danger
      reviewBody = <p dangerouslySetInnerHTML={reviewBodySanitized} />;
    } else {
      byLine = <LoadingText />;
      reviewBody = <p><LoadingText /></p>;
    }

    return (
      <div className="AddonReviewListItem">
        <h3>{review ? review.title : <LoadingText />}</h3>
        {reviewBody}
        <div className="AddonReviewListItem-by-line">
          {review ?
            <Rating styleName="small" rating={review.rating} readOnly />
            : null
          }
          {byLine}
        </div>
        {userIsAuthenticated && review && review.userId === siteUser.id ?
          <div className="AddonReviewListItem-controls">
            {/* This will render an overlay to edit the review */}
            {this.state.editingReview ?
              <AddonReview
                onEscapeOverlay={this.onEscapeReviewOverlay}
                onReviewSubmitted={this.onReviewSubmitted}
                review={review}
              />
              : null
            }
            <Button
              onClick={this.onClickToEditReview}
              className="AddonReviewListItem-edit-button Button--action Button--small"
            >
              {i18n.gettext('Edit')}
            </Button>
          </div>
          : null
        }
      </div>
    );
  }
}

export function mapStateToProps(
  state: {| user: UserStateType |},
) {
  return {
    isAuthenticated: isAuthenticated(state),
    siteUser: state.user,
  };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(AddonReviewListItemBase);
