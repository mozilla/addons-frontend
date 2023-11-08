/* @flow */
/* global window */
import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import { connect } from 'react-redux';
import { compose } from 'redux';
import makeClassName from 'classnames';

import { getCurrentUser } from 'amo/reducers/users';
import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import Card from 'amo/components/Card';
import Select from 'amo/components/Select';
import SignedInUser from 'amo/components/SignedInUser';
import type { UserType } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

export type FeedbackFormValues = {|
  anonymous: boolean,
  name: string,
  email: string,
  text: string,
  category: string | null,
  location: string | null,
|};

type Props = {|
  errorHandler: ErrorHandlerType,
  contentHeader: React.Node,
  abuseIsLoading: boolean,
  abuseSubmitted: boolean,
  categoryHeader: string,
  categories: Array<string>,
  feedbackTitle: string,
  reportTitle: string,
  showLocation: boolean,
  onSubmit: (values: FeedbackFormValues) => void,
|};

type PropsFromState = {|
  currentUser: UserType | null,
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

type State = {|
  ...FeedbackFormValues,
  certification: boolean,
|};

type Reason = {|
  value: string,
  label: string,
  help: string,
|};

// A
export const CATEGORY_DOES_NOT_WORK = 'does_not_work';
// B
export const CATEGORY_FEEDBACK_SPAM = 'feedback_spam';
// C
export const CATEGORY_POLICY_VIOLATION = 'policy_violation';
// D
export const CATEGORY_HATEFUL_VIOLENT_DECEPTIVE = 'hateful_violent_deceptive';
// E
export const CATEGORY_ILLEGAL = 'illegal';
// F
export const CATEGORY_OTHER = 'other';

export const getCategories = (
  i18n: I18nType,
): {
  report: Array<Reason>,
  feedback: Array<Reason>,
} => {
  return {
    feedback: [
      {
        value: CATEGORY_DOES_NOT_WORK,
        label: i18n.gettext(
          'It doesn’t work, breaks websites, or slows down Firefox',
        ),
        help: i18n.gettext(`Example: Features are slow, hard to use, or don’t
          work; parts of websites won't load or look unusual.`),
      },
      {
        value: CATEGORY_FEEDBACK_SPAM,
        label: i18n.gettext('It’s SPAM'),
        help: i18n.gettext(
          'Example: The listing advertises unrelated products or services.',
        ),
      },
    ],
    report: [
      {
        value: CATEGORY_POLICY_VIOLATION,
        label: i18n.gettext('It violates Add-on Policies'),
        help: i18n.gettext(`Example: It compromised my data without informing
          or asking me, or it changed my search engine or home page without
          informing or asking me.`),
      },
      {
        value: CATEGORY_HATEFUL_VIOLENT_DECEPTIVE,
        label: i18n.gettext(`It contains hateful, violent, deceptive, or other
          inappropriate content`),
        help: i18n.gettext('Example: It contains racist imagery.'),
      },
      {
        value: CATEGORY_ILLEGAL,
        label: i18n.gettext(
          'It violates the law or contains content that violates the law',
        ),
        help: i18n.gettext(
          'Example: Copyright or Trademark Infringement, Fraud.',
        ),
      },
      {
        value: CATEGORY_OTHER,
        label: i18n.gettext('Something else'),
        help: i18n.gettext(
          'Anything that doesn’t fit into the other categories.',
        ),
      },
    ],
  };
};

const getLocationOptions = (
  i18n: I18nType,
): Array<{| children: string, value: string |}> => {
  return [
    { children: i18n.gettext('Select place'), value: '' },
    {
      children: i18n.gettext("On the add-on's page on this website"),
      value: 'amo',
    },
    { children: i18n.gettext('Inside the add-on'), value: 'addon' },
    { children: i18n.gettext('Both locations'), value: 'both' },
  ];
};

export class FeedbackFormBase extends React.Component<InternalProps, State> {
  static defaultProps: DefaultProps = {
    _window: typeof window !== 'undefined' ? window : {},
  };

  constructor(props: InternalProps) {
    super(props);

    const { currentUser } = props;

    this.state = {
      certification: false,
      ...this.getFeedbackFormValues(currentUser),
    };
  }

  componentDidUpdate(prevProps: InternalProps) {
    if (
      !prevProps.errorHandler.hasError() &&
      this.props.errorHandler.hasError()
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
    if (['anonymous', 'certification'].includes(name)) {
      newValue = checked;
    }

    this.setState({ [name]: newValue });
  };

  onSubmit: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();

    const { anonymous, email, name, text, category, location } = this.state;

    this.props.onSubmit({ anonymous, email, name, text, category, location });
  };

  getFeedbackFormValues(currentUser: UserType | null): FeedbackFormValues {
    const defaultFormValues = {
      anonymous: false,
      email: '',
      name: '',
      text: '',
      category: null,
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
    const { abuseIsLoading } = this.props;
    const { category, certification } = this.state;

    return (
      abuseIsLoading ||
      !category ||
      (this.isCertificationRequired() && !certification)
    );
  }

  renderReportSentConfirmation(): React.Node {
    const { i18n } = this.props;

    // Make sure the confirmation message is going to be visible.
    window.scrollTo(0, 0);

    return (
      <div>
        <Card header={i18n.gettext('Report submitted')}>
          <p className="FeedbackForm-success-first-paragraph">
            {i18n.gettext(`We have received your report. Thanks for letting us
              know.`)}
          </p>
        </Card>
      </div>
    );
  }

  isCertificationRequired(): boolean {
    return ['illegal'].includes(this.state.category);
  }

  renderCategories(categories: Array<Reason>): React.Node {
    return categories
      .filter((category) => this.props.categories.includes(category.value))
      .map((category) => (
        <li
          className="FeedbackForm-checkbox-wrapper"
          key={`FeedbackForm-category-${category.value}`}
        >
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
            className="FeedbackForm-label"
            htmlFor={`feedbackCategory${category.value}`}
          >
            {category.label}
          </label>
          {category.help && (
            <p className="FeedbackForm--help">{category.help}</p>
          )}
        </li>
      ));
  }

  render(): React.Node {
    const {
      abuseIsLoading,
      abuseSubmitted,
      categoryHeader,
      contentHeader,
      currentUser,
      errorHandler,
      feedbackTitle,
      i18n,
      reportTitle,
      showLocation,
    } = this.props;

    let errorMessage;
    if (
      errorHandler.hasError() &&
      ![401, 403, 404].includes(errorHandler.capturedError.responseStatusCode)
    ) {
      errorMessage = errorHandler.renderError();
    }

    const { report, feedback } = getCategories(i18n);

    const submitButtonText = abuseIsLoading
      ? i18n.gettext('Submitting your report…')
      : i18n.gettext('Submit report');

    return (
      <div className="FeedbackForm">
        {contentHeader}

        {abuseSubmitted ? (
          this.renderReportSentConfirmation()
        ) : (
          <form className="FeedbackForm-form" onSubmit={this.onSubmit}>
            <div className="FeedbackForm-form-messages">{errorMessage}</div>

            <Card className="FeedbackForm--Card" header={categoryHeader}>
              <h3>{feedbackTitle}</h3>
              <ul>{this.renderCategories(feedback)}</ul>

              <h3>{reportTitle}</h3>
              <ul>{this.renderCategories(report)}</ul>
            </Card>

            <Card
              className="FeedbackForm--Card"
              header={i18n.gettext('Provide more information')}
            >
              {showLocation &&
                this.state.category !== CATEGORY_DOES_NOT_WORK && (
                  <>
                    <label
                      className="FeedbackForm-label"
                      htmlFor="feedbackLocation"
                    >
                      {i18n.gettext('Place of the violation')}
                      <span>({i18n.gettext('optional')})</span>
                    </label>
                    <Select
                      className="FeedbackForm-location"
                      id="feedbackLocation"
                      name="location"
                      onChange={this.onFieldChange}
                      value={this.state.location}
                    >
                      {getLocationOptions(i18n).map((option) => {
                        return <option key={option.value} {...option} />;
                      })}
                    </Select>
                  </>
                )}

              <label className="FeedbackForm-label" htmlFor="feedbackText">
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
              <p className="FeedbackForm--help">
                {i18n.gettext(`Please provide any additional information that
                  may help us to understand your report (including which policy
                  you believe has been violated). While this information is not
                  required, failure to include it may prevent us from
                  addressing the reported content.`)}
              </p>
            </Card>

            <Card
              className="FeedbackForm--Card"
              header={i18n.gettext('Contact information')}
            >
              <p className="FeedbackForm-checkbox-wrapper">
                <input
                  type="checkbox"
                  className="FeedbackForm-anonymous"
                  id="feedbackAnonymous"
                  name="anonymous"
                  onChange={this.onFieldChange}
                  checked={!!this.state.anonymous}
                />
                <label
                  className="FeedbackForm-label"
                  htmlFor="feedbackAnonymous"
                >
                  {i18n.gettext('File report anonymously')}
                </label>
                <p className="FeedbackForm--help">
                  {i18n.gettext(`Filing an anonymous report will prevent us
                    from communicating with you about the report’s status, or
                    about any options for appeal.`)}
                </p>
              </p>

              {currentUser && (
                <SignedInUser
                  user={currentUser}
                  disabled={this.state.anonymous}
                />
              )}

              <label
                className={makeClassName('FeedbackForm-label', {
                  'FeedbackForm-label--disabled': this.state.anonymous,
                })}
                htmlFor="feedbackName"
              >
                {i18n.gettext('Your name')}
                {!currentUser && <span>({i18n.gettext('optional')})</span>}
              </label>
              <input
                className={makeClassName('FeedbackForm-name', {
                  'FeedbackForm-input--disabled': this.state.anonymous,
                })}
                id="feedbackName"
                name="name"
                disabled={!!currentUser}
                onChange={this.onFieldChange}
                value={
                  this.state.anonymous
                    ? ''
                    : this.state.name || (currentUser && currentUser.name)
                }
              />

              <label
                className={makeClassName('FeedbackForm-label', {
                  'FeedbackForm-label--disabled': this.state.anonymous,
                })}
                htmlFor="feedbackEmail"
              >
                {i18n.gettext('Your email address')}
                {!currentUser && <span>({i18n.gettext('optional')})</span>}
              </label>
              <input
                className={makeClassName('FeedbackForm-email', {
                  'FeedbackForm-input--disabled': this.state.anonymous,
                })}
                id="feedbackEmail"
                name="email"
                disabled={!!currentUser}
                onChange={this.onFieldChange}
                value={
                  this.state.anonymous
                    ? ''
                    : this.state.email || (currentUser && currentUser.email)
                }
              />

              {this.isCertificationRequired() && (
                <p className="FeedbackForm-checkbox-wrapper">
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
                    className="FeedbackForm-label"
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

function mapStateToProps(state: AppState): PropsFromState {
  const currentUser = getCurrentUser(state.users);

  return { currentUser };
}

const FeedbackForm: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(FeedbackFormBase);

export default FeedbackForm;
