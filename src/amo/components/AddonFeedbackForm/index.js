/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import makeClassName from 'classnames';

import { ADDON_TYPE_EXTENSION } from 'amo/constants';
import FeedbackForm, {
  CATEGORY_DOES_NOT_WORK,
  CATEGORY_FEEDBACK_SPAM,
  CATEGORY_HATEFUL_VIOLENT_DECEPTIVE,
  CATEGORY_ILLEGAL,
  CATEGORY_SOMETHING_ELSE,
  CATEGORY_POLICY_VIOLATION,
} from 'amo/components/FeedbackForm';
import { withInstallHelpers } from 'amo/installAddon';
import { ADDON_STATUS_UNKNOWN_NON_PUBLIC } from 'amo/sagas/addons';
import { sendAddonAbuseReport } from 'amo/reducers/abuse';
import translate from 'amo/i18n/translate';
import Card from 'amo/components/Card';
import AddonTitle from 'amo/components/AddonTitle';
import Icon from 'amo/components/Icon';
import Rating from 'amo/components/Rating';
import LoadingText from 'amo/components/LoadingText';
import { getAddonIconUrl } from 'amo/imageUtils';
import type { AddonAbuseState } from 'amo/reducers/abuse';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { AddonType } from 'amo/types/addons';
import type { DispatchFunc } from 'amo/types/redux';
import type { WithInstallHelpersInjectedProps } from 'amo/installAddon';
import type { InstalledAddon } from 'amo/reducers/installations';
import type { FeedbackFormValues } from 'amo/components/FeedbackForm';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  errorHandler: ErrorHandlerType,
|};

type PropsFromState = {|
  abuseReport: AddonAbuseState | null,
  loading: boolean,
  installedAddon: InstalledAddon | null,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...WithInstallHelpersInjectedProps,
  dispatch: DispatchFunc,
  jed: I18nType,
|};

export class AddonFeedbackFormBase extends React.Component<InternalProps> {
  isAddonNonPublic(): boolean {
    const { addon } = this.props;

    if (!addon) {
      return false;
    }

    return addon.is_disabled || addon.status !== 'public';
  }

  onSubmit: (values: FeedbackFormValues) => void = (
    values: FeedbackFormValues,
  ) => {
    const { addon, dispatch, errorHandler, installedAddon } = this.props;
    const { anonymous, email, name, text, category, location } = values;

    invariant(addon, 'An add-on is required for a report.');

    dispatch(
      sendAddonAbuseReport({
        errorHandlerId: errorHandler.id,
        // We need to send the GUID because the abuse report API doesn't accept
        // anything else for pure unlisted add-ons.
        addonId: addon.guid,
        reporterEmail: anonymous ? '' : email,
        reporterName: anonymous ? '' : name,
        message: text,
        reason: category,
        location:
          this.isAddonNonPublic() || category === CATEGORY_DOES_NOT_WORK
            ? 'addon'
            : location,
        addonVersion: installedAddon?.version || null,
        // Only authenticate the API call when the report isn't submitted
        // anonymously.
        auth: anonymous === false,
      }),
    );
  };

  renderHeader(): React.Node {
    const { addon, installedAddon, jed } = this.props;

    // When we don't have much information about the add-on because it is a
    // non-public one, and the add-on is not installed, then we hide the header.
    if (!installedAddon && addon?.status === ADDON_STATUS_UNKNOWN_NON_PUBLIC) {
      return null;
    }

    // When the add-on is installed, we use the name from the installed add-on.
    // Otherwise, we'll use the name from the loaded add-on.
    let addonName = addon?.name;
    if (installedAddon?.name) {
      addonName = installedAddon.name;
    }

    return (
      <Card className="AddonFeedbackForm-header">
        <div className="AddonFeedbackForm-header-icon">
          <div className="AddonFeedbackForm-header-icon-wrapper">
            <img
              className="AddonFeedbackForm-header-icon-image"
              src={getAddonIconUrl(addon)}
              alt=""
            />
          </div>
        </div>

        <AddonTitle
          addon={addon ? { ...addon, name: addonName || '' } : addon}
        />

        {!this.isAddonNonPublic() && (
          <div className="AddonFeedbackForm-header-metadata">
            <div className="AddonFeedbackForm-header-metadata-adu">
              <Icon name="user-fill" />
              {addon ? (
                jed.sprintf(
                  jed.ngettext(
                    '%(total)s user',
                    '%(total)s users',
                    addon.average_daily_users,
                  ),
                  { total: jed.formatNumber(addon.average_daily_users) },
                )
              ) : (
                <LoadingText />
              )}
            </div>
            <div className="AddonFeedbackForm-header-metadata-rating">
              {addon ? (
                <Rating
                  rating={addon.ratings.average}
                  readOnly
                  styleSize="small"
                />
              ) : (
                <LoadingText />
              )}
            </div>
          </div>
        )}
      </Card>
    );
  }

  render(): React.Node {
    const { abuseReport, addon, errorHandler, jed, loading } = this.props;
    const abuseSubmitted = abuseReport && abuseReport.message !== undefined;
    const addonType = addon ? addon.type : ADDON_TYPE_EXTENSION;

    let categories = [
      CATEGORY_DOES_NOT_WORK,
      CATEGORY_FEEDBACK_SPAM,
      CATEGORY_POLICY_VIOLATION,
      CATEGORY_HATEFUL_VIOLENT_DECEPTIVE,
      CATEGORY_ILLEGAL,
      CATEGORY_SOMETHING_ELSE,
    ];
    if (addonType !== ADDON_TYPE_EXTENSION) {
      categories = categories.filter(
        (category) =>
          ![CATEGORY_DOES_NOT_WORK, CATEGORY_POLICY_VIOLATION].includes(
            category,
          ),
      );
    }

    return (
      <div
        className={makeClassName('AddonFeedbackForm', {
          'AddonFeedbackForm--no-metadata': this.isAddonNonPublic(),
        })}
      >
        <FeedbackForm
          errorHandler={errorHandler}
          contentHeader={this.renderHeader()}
          abuseIsLoading={loading}
          abuseSubmitted={!!abuseSubmitted}
          categoryHeader={jed.gettext('Report this add-on to Mozilla')}
          feedbackTitle={jed.gettext('Send some feedback about the add-on')}
          reportTitle={jed.gettext(
            "Report the add-on because it's illegal or incompliant",
          )}
          categories={categories}
          showLocation={!this.isAddonNonPublic()}
          onSubmit={this.onSubmit}
        />
      </div>
    );
  }
}

function mapStateToProps(state: AppState, ownProps: Props): PropsFromState {
  const { addon } = ownProps;
  const installedAddon =
    (addon?.guid && state.installations[addon.guid]) || null;

  return {
    abuseReport: (addon?.guid && state.abuse.byGUID[addon.guid]) || null,
    loading: state.abuse.loading,
    installedAddon,
  };
}

const AddonFeedbackForm: React.ComponentType<Props> = compose(
  withInstallHelpers,
  connect(mapStateToProps),
  translate(),
)(AddonFeedbackFormBase);

export default AddonFeedbackForm;
