/* @flow */
/* global window */
import invariant from 'invariant';
import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { withInstallHelpers } from 'amo/installAddon';
import { sendAddonAbuseReport } from 'amo/reducers/abuse';
import { getCurrentUser } from 'amo/reducers/users';
import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import Card from 'amo/components/Card';
import AddonTitle from 'amo/components/AddonTitle';
import Notice from 'amo/components/Notice';
import Select from 'amo/components/Select';
import SignedInUser from 'amo/components/SignedInUser';
import { getAddonIconUrl } from 'amo/imageUtils';
import type { AddonAbuseState } from 'amo/reducers/abuse';
import type { UserType } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { AddonType } from 'amo/types/addons';
import type { DispatchFunc } from 'amo/types/redux';
import type { WithInstallHelpersInjectedProps } from 'amo/installAddon';
import type { InstalledAddon } from 'amo/reducers/installations';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  errorHandler: ErrorHandlerType,
|};

type PropsFromState = {|
  abuseReport: AddonAbuseState | null,
  currentUser: UserType | null,
  loading: boolean,
  installedAddon: InstalledAddon | null,
|};

type DefaultProps = {|
  _window: typeof window | Object,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...DefaultProps,
  ...WithInstallHelpersInjectedProps,
  dispatch: DispatchFunc,
  i18n: I18nType,
|};

type FormValues = {|
  name: string,
  email: string,
  text: string,
  category: string | null,
  certification: boolean,
  location: string | null,
|};

type State = {|
  ...FormValues,
  successMessage: string | null,
|};

type Reason = {|
  value: string,
  label: string,
  help: string,
|};

export const getCategories = (
  i18n: I18nType,
): {
  report: Array<Reason>,
  feedback: Array<Reason>,
} => {
  return {
    feedback: [
      {
        value: 'does_not_work',
        label: i18n.gettext(
          'It doesn’t work, breaks websites, or slows down Firefox',
        ),
        help: i18n.gettext(
          "Example: Features are slow, hard to use, or don’t work; parts of websites won't load or look unusual.",
        ),
      },
      {
        value: 'feedback_spam',
        label: i18n.gettext('It’s SPAM'),
        help: i18n.gettext(
          'Example: The listing advertises unrelated products or services.',
        ),
      },
    ],
    report: [
      {
        value: 'policy_violation',
        label: i18n.gettext('It violates Add-on Policies'),
        help: i18n.gettext(
          'Example: It compromised my data without informing or asking me, or it changed my search engine or home page without informing or asking me.',
        ),
      },
      {
        value: 'hateful_violent_deceptive',
        label: i18n.gettext(
          'It contains hateful, violent, deceptive, or other inappropriate content',
        ),
        help: i18n.gettext('Example: It contains racist imagery.'),
      },
      {
        value: 'illegal',
        label: i18n.gettext(
          'It violates the law or contains content that violates the law',
        ),
        help: i18n.gettext(
          'Example: Copyright or Trademark Infringement, Fraud.',
        ),
      },
      {
        value: 'other',
        label: i18n.gettext('Something else'),
        help: i18n.gettext(
          'Anything that doesn’t fit into the other categories.',
        ),
      },
    ],
  };
};

export class FeedbackFormBase extends React.Component<InternalProps, State> {
  static defaultProps: DefaultProps = {
    _window: typeof window !== 'undefined' ? window : {},
  };

  constructor(props: InternalProps) {
    super(props);

    const { currentUser } = props;

    this.state = {
      successMessage: null,
      ...this.getFormValues(currentUser),
    };
  }

  componentDidUpdate(prevProps: InternalProps, prevState: State) {
    if (
      (!prevProps.errorHandler.hasError() &&
        this.props.errorHandler.hasError()) ||
      (!prevState.successMessage && this.state.successMessage)
    ) {
      this.props._window.scroll(0, 0);
    }
  }

  componentWillUnmount() {
    this.props.errorHandler.clear();
  }

  onFieldChange: (event: SyntheticEvent<HTMLInputElement>) => void = (
    event: SyntheticEvent<HTMLInputElement>,
  ) => {
    const { name, value, checked } = event.currentTarget;

    let newValue: boolean | string | null = value;
    if (name === 'certification') {
      newValue = checked;
    }

    this.setState({
      [name]: newValue,
      successMessage: null,
    });
  };

  onSubmit: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();

    const { addon, dispatch, errorHandler, installedAddon } = this.props;
    const { email, name, text, category, location } = this.state;

    invariant(addon, 'An add-on is required for a report.');

    dispatch(
      sendAddonAbuseReport({
        errorHandlerId: errorHandler.id,
        // We need to send the GUID because the abuse report API doesn't accept
        // anything else for pure unlisted add-ons.
        addonId: addon.guid,
        reporterEmail: email,
        reporterName: name,
        message: text,
        reason: category,
        location,
        addonVersion: installedAddon?.version || null,
      }),
    );
  };

  getFormValues(currentUser: UserType | null): FormValues {
    const defaultFormValues = {
      email: '',
      name: '',
      text: '',
      category: null,
      certification: false,
      location: null,
    };

    const { email, display_name: name } = currentUser || {};

    return {
      ...defaultFormValues,
      email: email || '',
      name: name || '',
    };
  }

  preventSubmit(): boolean {
    const { loading } = this.props;
    const { category, certification } = this.state;

    return (
      loading || !category || (this.isCertificationRequired() && !certification)
    );
  }

  renderReportSentConfirmation(i18n: I18nType): React.Node {
    return (
      <div>
        <Card header={i18n.gettext('You sent a report about this add-on')}>
          <p className="FeedbackForm-success-first-paragraph">
            {i18n.gettext(`We have received your report. Thanks for letting us
              know.`)}
          </p>
        </Card>
      </div>
    );
  }

  isCertificationRequired(): boolean {
    return ['illegal', 'hateful_violent_deceptive'].includes(
      this.state.category,
    );
  }

  render(): React.Node {
    const { abuseReport, addon, currentUser, errorHandler, i18n, loading } =
      this.props;

    let errorMessage;
    if (
      errorHandler.hasError() &&
      ![401, 403, 404].includes(errorHandler.capturedError.responseStatusCode)
    ) {
      errorMessage = errorHandler.renderError();
    }

    const submitButtonText = loading
      ? i18n.gettext('Submitting your report…')
      : i18n.gettext('Submit report');

    const categories = getCategories(i18n);
    const categoryInputs = {};
    // eslint-disable-next-line guard-for-in
    for (const categoryType in categories) {
      categoryInputs[categoryType] = [];
      categories[categoryType].forEach((category) => {
        categoryInputs[categoryType].push(
          <li className="FeedbackForm-category--li" id={`li-${category.value}`}>
            <input
              type="radio"
              className="FeedbackForm-catgeory"
              id={`feedbackCategory${category.value}`}
              name="category"
              onChange={this.onFieldChange}
              value={category.value}
              selected={this.state.category === category.value}
            />
            <label
              className="FeedbackForm--label"
              htmlFor={`feedbackCategory${category.value}`}
            >
              {category.label}
            </label>
            {category.help && (
              <p className="FeedbackForm--help">{category.help}</p>
            )}
          </li>,
        );
      });
    }

    const locationOptions = [
      { children: i18n.gettext('Select place'), value: '' },
      {
        children: i18n.gettext("On the add-on's page on this website"),
        value: 'amo',
      },
      { children: i18n.gettext('Inside the add-on'), value: 'addon' },
      { children: i18n.gettext('Both locations'), value: 'both' },
    ];

    const abuseSubmitted = abuseReport && abuseReport.message !== undefined;

    return (
      <div className="FeedbackForm">
        <Card className="FeedbackForm-header">
          <div className="FeedbackForm-header-icon">
            <div className="FeedbackForm-header-icon-wrapper">
              <img
                className="FeedbackForm-header-icon-image"
                src={getAddonIconUrl(addon)}
                alt=""
              />
            </div>
          </div>

          <AddonTitle addon={addon} />
        </Card>

        {abuseSubmitted ? (
          this.renderReportSentConfirmation(i18n)
        ) : (
          <form className="FeedbackForm-form" onSubmit={this.onSubmit}>
            <div className="FeedbackForm-form-messages">
              {errorMessage}

              {this.state.successMessage && (
                <Notice type="success">{this.state.successMessage}</Notice>
              )}
            </div>

            <Card
              className="FeedbackForm--Card"
              header={i18n.gettext('Report this add-on to Mozilla')}
            >
              <h3>{i18n.gettext('Send some feedback about the add-on')}</h3>
              <ul>{categoryInputs.feedback}</ul>

              <h3>
                {i18n.gettext(
                  "Report the add-on because it's illegal or incompliant",
                )}
              </h3>
              <ul>{categoryInputs.report}</ul>
            </Card>

            <Card
              className="FeedbackForm--Card"
              header={i18n.gettext('Provide more information')}
            >
              <label className="FeedbackForm--label" htmlFor="feedbackLocation">
                {i18n.gettext('Place of the violation')}
              </label>
              <Select
                className="FeedbackForm-location"
                id="feedbackLocation"
                name="location"
                onChange={this.onFieldChange}
                value={this.state.location}
              >
                {locationOptions.map((option) => {
                  return <option key={option.value} {...option} />;
                })}
              </Select>

              <label className="FeedbackForm--label" htmlFor="feedbackText">
                {i18n.gettext('Provide more details')}
                <span>({i18n.gettext('optional')})</span>
              </label>
              <Textarea
                className="FeedbackForm-text"
                id="feedbackText"
                name="text"
                onChange={this.onFieldChange}
                value={this.state.text}
              />
            </Card>

            <Card
              className="FeedbackForm--Card"
              header={i18n.gettext('Contact information')}
            >
              {currentUser && <SignedInUser user={currentUser} />}

              <label className="FeedbackForm--label" htmlFor="feedbackName">
                {i18n.gettext('Your name')}
              </label>
              <input
                className="FeedbackForm-name"
                id="feedbackName"
                name="name"
                disabled={currentUser}
                onChange={this.onFieldChange}
                value={this.state.name || (currentUser && currentUser.name)}
              />

              <label className="FeedbackForm--label" htmlFor="feedbackEmail">
                {i18n.gettext('Your email address')}
              </label>
              <input
                className="FeedbackForm-email"
                id="feedbackEmail"
                name="email"
                disabled={currentUser}
                onChange={this.onFieldChange}
                value={this.state.email || (currentUser && currentUser.email)}
              />

              {this.isCertificationRequired() && (
                <p>
                  <input
                    type="checkbox"
                    className="FeedbackForm-certification"
                    id="feedbackCertification"
                    name="certification"
                    onChange={this.onFieldChange}
                    checked={!!this.state.certification}
                    required={this.isCertificationRequired()}
                  />
                  <label
                    className="FeedbackForm--label"
                    htmlFor="feedbackCertification"
                  >
                    {i18n.gettext(`By submitting this report I certify, under
                    penalty of perjury, that the allegations it contains are
                    complete and accurate, to the best of my knowledge.`)}
                  </label>
                </p>
              )}
            </Card>

            <div className="FeedbackForm-buttons-wrapper">
              <Button
                buttonType="action"
                className="FeedbackForm-submit-button FeedbackForm-button"
                disabled={this.preventSubmit()}
                puffy
                type="submit"
              >
                {submitButtonText}
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }
}

function mapStateToProps(state: AppState, ownProps: Props): PropsFromState {
  const { addon } = ownProps;
  const currentUser = getCurrentUser(state.users);
  const installedAddon =
    (addon?.guid && state.installations[addon.guid]) || null;

  return {
    abuseReport: (addon?.slug && state.abuse.bySlug[addon.slug]) || null,
    currentUser,
    loading: state.abuse.loading,
    installedAddon,
  };
}

const FeedbackForm: React.ComponentType<Props> = compose(
  withInstallHelpers,
  connect(mapStateToProps),
  translate(),
)(FeedbackFormBase);

export default FeedbackForm;
