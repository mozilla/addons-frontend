/* @flow */
/* global window */
import invariant from 'invariant';
import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { sendAddonAbuseReport } from 'amo/reducers/abuse';
import { getCurrentUser } from 'amo/reducers/users';
import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import Card from 'amo/components/Card';
import Notice from 'amo/components/Notice';
import Select from 'amo/components/Select';
import type { AddonAbuseState } from 'amo/reducers/abuse';
import type { UserType } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { AddonType } from 'amo/types/addons';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  addonId: string,
  errorHandler: ErrorHandlerType,
|};

type PropsFromState = {|
  abuseReport: AddonAbuseState | null,
  currentUser: UserType | null,
  loading: boolean,
|};

type DefaultProps = {|
  _window: typeof window | Object,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...DefaultProps,
  dispatch: DispatchFunc,
  i18n: I18nType,
|};

type FormValues = {|
  name: string,
  email: string,
  text: string,
  category: string | null,
  legalAssertion: boolean,
  violationLocation: string | null,
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
          "Example: Features are slow, hard to use, or don’t work; parts of websites won't load or look unusual",
        ),
      },
      {
        value: 'feedback_spam',
        label: i18n.gettext('It’s SPAM'),
        help: i18n.gettext(
          'Example: An application installed it without my permission',
        ),
      },
    ],
    report: [
      {
        value: 'policy_violation',
        label: i18n.gettext('It violates Add-on Policies'),
        help: i18n.gettext(
          'Example: I didn’t want it or It compromised my data without informing or asking me, or it changed my search engine or home page without informing or asking me.',
        ),
      },
      {
        value: 'hateful_violent_deceptive',
        label: i18n.gettext(
          'It contains hateful, violent, deceptive, or other inappropriate content',
        ),
        help: i18n.gettext('Example: contains racist imagery'),
      },
      {
        value: 'illegal',
        label: i18n.gettext(
          'It violates the law or contains content that violates the law',
        ),
        help: i18n.gettext(
          'Example: Copyright or Trademark Infringement, Fraud',
        ),
      },
      {
        value: 'other',
        label: i18n.gettext('Something else'),
        help: i18n.gettext(
          'Anything that doesn’t fit into the other categories',
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
    const { name, value } = event.currentTarget;

    this.setState({
      [name]: value,
      successMessage: null,
    });
  };

  onSubmit: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();

    const { addon, dispatch, errorHandler } = this.props;
    const { email, name, text, category, violationLocation } = this.state;

    invariant(text.trim().length, 'A report cannot be sent with no content.');
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
        location: violationLocation,
      }),
    );
  };

  getFormValues(currentUser: UserType | null): FormValues {
    const defaultFormValues = {
      email: '',
      name: '',
      text: '',
      category: null,
      legalAssertion: false,
      violationLocation: null,
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
    const { text, category, legalAssertion } = this.state;

    return (
      loading ||
      !category ||
      !text ||
      (text && text.trim() === '') ||
      !legalAssertion
    );
  }

  renderReportSentConfirmation(i18n: I18nType): React.Node {
    return (
      <div>
        <Card
          header={i18n.gettext('You sent a report about this add-on')}
          className="FeedbackForm--Card"
        >
          <p className="ReportAbuseButton-first-paragraph">
            {i18n.gettext(
              `We have received your report. Thanks for letting us know.`,
            )}
          </p>
        </Card>
      </div>
    );
  }

  render(): React.Node {
    const { addonId, abuseReport, currentUser, errorHandler, i18n, loading } =
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
            <p className="FeedbackForm--help">{category.help}</p>
          </li>,
        );
      });
    }

    const violationLocationOptions = [
      { children: i18n.gettext('--Select a location--'), value: '' },
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
        <Helmet>
          <title>
            {i18n.sprintf(
              i18n.gettext(
                'Submit feedback or report for %(type)s %(identifier)s',
              ),
              {
                type: i18n.gettext('Add-on'),
                identifier: addonId,
              },
            )}
          </title>
        </Helmet>

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
            <div>
              <Card
                className="FeedbackForm--Card"
                header={i18n.gettext('Send some feedback about an add-on')}
              >
                <ul>{categoryInputs.feedback}</ul>
              </Card>
              <Card
                className="FeedbackForm--Card"
                header={i18n.gettext(
                  "Report an add-on to Mozilla because it's illegal or incompliant",
                )}
              >
                <ul>{categoryInputs.report}</ul>
              </Card>

              <Card
                className="FeedbackForm--Card"
                header={i18n.gettext('Tell us more')}
              >
                <label
                  className="FeedbackForm--label"
                  htmlFor="feedbackLocation"
                >
                  {i18n.gettext('Where is the offending content')}
                </label>
                <Select
                  className="FeedbackForm-violationLocation"
                  id="feedbackLocation"
                  name="violationLocation"
                  onChange={this.onFieldChange}
                  value={this.state.violationLocation}
                >
                  {violationLocationOptions.map((option) => {
                    return <option key={option.value} {...option} />;
                  })}
                </Select>

                <label className="FeedbackForm--label" htmlFor="feedbackText">
                  {i18n.gettext('Give details of your feedback or report')}
                </label>
                <Textarea
                  className="FeedbackForm-text"
                  id="feedbackText"
                  name="text"
                  onChange={this.onFieldChange}
                  value={this.state.text}
                />
                <input
                  type="checkbox"
                  className="FeedbackForm-legalAssertion"
                  id="feedbackLegalAssertion"
                  name="legalAssertion"
                  onChange={this.onFieldChange}
                  required="true"
                />
                <label
                  className="FeedbackForm--label"
                  htmlFor="feedbackLegalAssertion"
                >
                  {i18n.gettext(
                    'I hereby certify, under penalty of perjury, my bona fide belief ' +
                      'that the allegations in this report are complete and accurate. ' +
                      'For allegations of trademark or copyright infringement, I further ' +
                      'certify that I am either the affected rightsholder, or have been ' +
                      "authorized to act on that rightsholder's behalf.",
                  )}
                </label>
              </Card>

              <Card
                className="FeedbackForm--Card"
                header={i18n.gettext('Your details')}
              >
                <p className="FeedbackForm-details-aside">
                  {currentUser
                    ? i18n.gettext(
                        'We will notify you by email with any updates about your report.',
                      )
                    : i18n.gettext(
                        'To receive updates about your report enter your name and email address.',
                      )}
                </p>
                <label className="FeedbackForm--label" htmlFor="feedbackName">
                  {i18n.gettext('Your Full Name')}
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
                  {i18n.gettext('Your Email Address')}
                </label>
                <input
                  className="FeedbackForm-email"
                  id="feedbackEmail"
                  name="email"
                  disabled={currentUser}
                  onChange={this.onFieldChange}
                  value={this.state.email || (currentUser && currentUser.email)}
                />
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

  return {
    abuseReport: (addon?.slug && state.abuse.bySlug[addon.slug]) || null,
    currentUser,
    loading: state.abuse.loading,
  };
}

const FeedbackForm: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(FeedbackFormBase);

export default FeedbackForm;
