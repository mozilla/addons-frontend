/* @flow */
/* global window */
import invariant from 'invariant';
import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Page from 'amo/components/Page';
import { sendAddonAbuseReport } from 'amo/reducers/abuse';
import { getCurrentUser } from 'amo/reducers/users';
import { withFixedErrorHandler } from 'amo/errorHandler';
import log from 'amo/logger';
import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import Card from 'amo/components/Card';
import Notice from 'amo/components/Notice';
import type { AddonAbuseState } from 'amo/reducers/abuse';
import type { UserType } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterMatchType } from 'amo/types/router';

import './styles.scss';

type Props = {|
  match: {|
    ...ReactRouterMatchType,
    params: {| addonIdentifier: string |},
  |},
|};

type PropsFromState = {|
  currentUser: UserType | null,
  loading: boolean,
  abuseReport: AddonAbuseState | null,
|};

type DefaultProps = {|
  _window: typeof window | Object,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...DefaultProps,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

type FormValues = {|
  name: string,
  email: string,
  text: string,
  category: string | null,
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
        value: 'not_wanted',
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
        value: 'hate_speech',
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
          'Anything that does’t fit into the other categories',
        ),
      },
    ],
  };
};

export class FeedbackBase extends React.Component<InternalProps, State> {
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

    const {
      dispatch,
      errorHandler,
      match: {
        params: { addonIdentifier },
      },
    } = this.props;
    const { email, name, text, category } = this.state;

    invariant(text.trim().length, 'A report cannot be sent with no content.');
    invariant(addonIdentifier, 'An add-on identifer is needed for a report.');

    dispatch(
      sendAddonAbuseReport({
        errorHandlerId: errorHandler.id,
        addonSlug: addonIdentifier,
        reporter_email: email,
        reporter_name: name,
        message: text,
        reason: category,
      }),
    );
  };

  getFormValues(currentUser: UserType | null): FormValues {
    const defaultFormValues = {
      email: '',
      name: '',
      text: '',
      category: null,
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
    const { text, category } = this.state;

    return loading || !category || !text || (text && text.trim() === '');
  }

  render(): React.Node {
    const {
      errorHandler,
      i18n,
      loading,
      currentUser,
      match: {
        params: { addonIdentifier },
      },
      abuseReport,
    } = this.props;

    let errorMessage;

    if (errorHandler.hasError()) {
      log.warn(`Captured API Error: ${errorHandler.capturedError.messages}`);

      if (errorHandler.capturedError.responseStatusCode === 404) {
        return <NotFoundPage />;
      }

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
          <li className="Feedback-category--li" id={`li-${category.value}`}>
            <input
              type="radio"
              className="Feedback-catgeory"
              id={`feedbackCategory${category.value}`}
              name="category"
              onChange={this.onFieldChange}
              value={category.value}
              selected={this.state.category === category.value}
            />
            <label
              className="Feedback--label"
              htmlFor={`feedbackCategory${category.value}`}
            >
              {category.label}
            </label>
            <p className="Feedback--help">{category.help}</p>
          </li>,
        );
      });
    }

    const abuseSubmitted = abuseReport && abuseReport.message !== undefined;

    return (
      <Page>
        <div className="Feedback">
          <Helmet>
            <title>
              {i18n.sprintf(
                i18n.gettext('Submit Feedback for %(type)s %(identifer)s'),
                {
                  type: i18n.gettext('Addon'),
                  identifer: addonIdentifier,
                },
              )}
            </title>
          </Helmet>

          {abuseSubmitted && (
            <div>
              <Card
                header={i18n.gettext('You sent a report about this add-on')}
                className="Feedback--Card"
              >
                <p className="ReportAbuseButton-first-paragraph">
                  {i18n.gettext(
                    `We have received your report. Thanks for letting us know.`,
                  )}
                </p>
              </Card>
            </div>
          )}

          {!abuseSubmitted && (
            <form className="Feedback-form" onSubmit={this.onSubmit}>
              <div className="Feedback-form-messages">
                {errorMessage}

                {this.state.successMessage && (
                  <Notice type="success">{this.state.successMessage}</Notice>
                )}
              </div>
              <div>
                <Card
                  className="Feedback--Card"
                  header={i18n.gettext('Send some feedback about an add-on')}
                >
                  <ul>{categoryInputs.feedback}</ul>
                </Card>
                <Card
                  className="Feedback--Card"
                  header={i18n.gettext(
                    "Report an add-on to Mozilla because it's illegal or incompliant",
                  )}
                >
                  <ul>{categoryInputs.report}</ul>
                </Card>

                <Card
                  className="Feedback--Card"
                  header={i18n.gettext('Tell us more')}
                >
                  <label className="Feedback--label" htmlFor="feedbackText">
                    {i18n.gettext('Give details of your feedback or report')}
                  </label>
                  <Textarea
                    className="Feedback-text"
                    id="feedbackText"
                    name="text"
                    onChange={this.onFieldChange}
                    value={this.state.text}
                  />
                  <input
                    type="checkbox"
                    className="Feedback-legalAssertion"
                    id="feedbackLegalAssertion"
                    name="legalAssertion"
                    onChange={this.onFieldChange}
                    required="true"
                  />
                  <label
                    className="Feedback--label"
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
                  className="Feedback--Card"
                  header={i18n.gettext('Your details')}
                >
                  <p className="Feedback-details-aside">
                    {currentUser
                      ? i18n.gettext(
                          'We will notify you by email with any updates about your report.',
                        )
                      : i18n.gettext(
                          'To receive updates about your report enter your name and email address.',
                        )}
                  </p>
                  <label className="Feedback--label" htmlFor="feedbackName">
                    {i18n.gettext('Your Full Name')}
                  </label>
                  <input
                    className="Feedback-name"
                    id="feedbackName"
                    name="name"
                    disabled={currentUser}
                    onChange={this.onFieldChange}
                    value={this.state.name || (currentUser && currentUser.name)}
                  />

                  <label className="Feedback--label" htmlFor="feedbackEmail">
                    {i18n.gettext('Your Email Address')}
                  </label>
                  <input
                    className="Feedback-email"
                    id="feedbackEmail"
                    name="email"
                    disabled={currentUser}
                    onChange={this.onFieldChange}
                    value={
                      this.state.email || (currentUser && currentUser.email)
                    }
                  />
                </Card>

                <div className="Feedback-buttons-wrapper">
                  <Button
                    buttonType="action"
                    className="Feedback-submit-button Feedback-button"
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
      </Page>
    );
  }
}

function mapStateToProps(
  state: AppState,
  ownProps: InternalProps,
): PropsFromState {
  const { params } = ownProps.match;
  const { addonIdentifier } = params;

  const currentUser = getCurrentUser(state.users);

  return {
    currentUser,
    loading: state.abuse.loading,
    abuseReport: state.abuse.byGUID[addonIdentifier]
      ? state.abuse.byGUID[addonIdentifier]
      : null,
  };
}

export const extractId = (ownProps: InternalProps): string => {
  return ownProps.match.params.addonIdentifier;
};

const Feedback: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(FeedbackBase);

export default Feedback;
