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
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import { sanitizeHTML } from 'amo/utils';
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
  illegalCategory: string | null,
  illegalSubcategory: string | null,
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
// Note that `other` category technically exists but only for add-ons, it's for
// the previous abuse reporting mechanism.
export const CATEGORY_SOMETHING_ELSE = 'something_else';

export const LEGAL_REPORT_INFRINGEMENT_URL =
  'https://www.mozilla.org/en-US/about/legal/report-infringement/';

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
        label: i18n.gettext('It’s spam'),
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
        help: i18n.sprintf(
          i18n.gettext(`Example: Fraud. (If you wish to report a copyright or
              trademark infringement, you can learn more about how to do so in
              our %(startLink)sCopyright or Trademark Infringement Reporting
              article%(endLink)s).`),
          {
            startLink: `<a href="${LEGAL_REPORT_INFRINGEMENT_URL}">`,
            endLink: '</a>',
          },
        ),
      },
      {
        value: CATEGORY_SOMETHING_ELSE,
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

// These categories don't have any subcategories other than "other".
export const ILLEGAL_CATEGORIES_WITHOUT_SUBCATEGORIES = [
  'animal_welfare',
  'other',
];

export const getIllegalCategoryOptions = (
  i18n: I18nType,
): Array<{| children: string, value: string |}> => {
  return [
    { children: i18n.gettext('Select type'), value: '' },
    { value: 'animal_welfare', children: i18n.gettext('Animal welfare') },
    {
      value: 'consumer_information',
      children: i18n.gettext('Consumer information infringements'),
    },
    {
      value: 'data_protection_and_privacy_violations',
      children: i18n.gettext('Data protection and privacy violations'),
    },
    {
      value: 'illegal_or_harmful_speech',
      children: i18n.gettext('Illegal or harmful speech'),
    },
    {
      value: 'intellectual_property_infringements',
      children: i18n.gettext('Intellectual property infringements'),
    },
    {
      value: 'negative_effects_on_civic_discourse_or_elections',
      children: i18n.gettext(
        'Negative effects on civic discourse or elections',
      ),
    },
    {
      value: 'non_consensual_behaviour',
      children: i18n.gettext('Non-consensual behavior'),
    },
    {
      value: 'pornography_or_sexualized_content',
      children: i18n.gettext('Pornography or sexualized content'),
    },
    {
      value: 'protection_of_minors',
      children: i18n.gettext('Protection of minors'),
    },
    {
      value: 'risk_for_public_security',
      children: i18n.gettext('Risk for public security'),
    },
    { value: 'scams_and_fraud', children: i18n.gettext('Scams or fraud') },
    { value: 'self_harm', children: i18n.gettext('Self-harm') },
    {
      value: 'unsafe_and_prohibited_products',
      children: i18n.gettext('Unsafe, non-compliant, or prohibited products'),
    },
    { value: 'violence', children: i18n.gettext('Violence') },
    { value: 'other', children: i18n.gettext('Other') },
  ];
};

export const getIllegalSubcategoryOptions = (
  i18n: I18nType,
  category: string | null,
): Array<{| children: string, value: string |}> => {
  const options = [{ children: i18n.gettext('Select violation'), value: '' }];

  switch (category) {
    case 'consumer_information':
      options.push(
        ...[
          {
            value: 'insufficient_information_on_traders',
            children: i18n.gettext('Insufficient information on traders'),
          },
          {
            value: 'noncompliance_pricing',
            children: i18n.gettext('Non-compliance with pricing regulations'),
          },
          {
            value: 'hidden_advertisement',
            children: i18n.gettext(
              'Hidden advertisement or commercial communication, including by influencers',
            ),
          },
          {
            value: 'misleading_info_goods_services',
            children: i18n.gettext(
              'Misleading information about the characteristics of the goods and services',
            ),
          },
          {
            value: 'misleading_info_consumer_rights',
            children: i18n.gettext(
              'Misleading information about the consumer’s rights',
            ),
          },
        ],
      );
      break;

    case 'data_protection_and_privacy_violations':
      options.push(
        ...[
          {
            value: 'biometric_data_breach',
            children: i18n.gettext('Biometric data breach'),
          },
          {
            value: 'missing_processing_ground',
            children: i18n.gettext('Missing processing ground for data'),
          },
          {
            value: 'right_to_be_forgotten',
            children: i18n.gettext('Right to be forgotten'),
          },
          {
            value: 'data_falsification',
            children: i18n.gettext('Data falsification'),
          },
        ],
      );
      break;

    case 'illegal_or_harmful_speech':
      options.push(
        ...[
          { value: 'defamation', children: i18n.gettext('Defamation') },
          { value: 'discrimination', children: i18n.gettext('Discrimination') },
          {
            value: 'hate_speech',
            children: i18n.gettext(
              'Illegal incitement to violence and hatred based on protected characteristics (hate speech)',
            ),
          },
        ],
      );
      break;

    case 'intellectual_property_infringements':
      options.push(
        ...[
          {
            value: 'design_infringement',
            children: i18n.gettext('Design infringements'),
          },
          {
            value: 'geographic_indications_infringement',
            children: i18n.gettext('Geographical indications infringements'),
          },
          {
            value: 'patent_infringement',
            children: i18n.gettext('Patent infringements'),
          },
          {
            value: 'trade_secret_infringement',
            children: i18n.gettext('Trade secret infringements'),
          },
        ],
      );
      break;

    case 'negative_effects_on_civic_discourse_or_elections':
      options.push(
        ...[
          {
            value: 'violation_eu_law',
            children: i18n.gettext(
              'Violation of EU law relevant to civic discourse or elections',
            ),
          },
          {
            value: 'violation_national_law',
            children: i18n.gettext(
              'Violation of national law relevant to civic discourse or elections',
            ),
          },
          {
            value: 'misinformation_disinformation_disinformation',
            children: i18n.gettext(
              'Misinformation, disinformation, foreign information manipulation and interference',
            ),
          },
        ],
      );
      break;

    case 'non_consensual_behaviour':
      options.push(
        ...[
          {
            value: 'non_consensual_image_sharing',
            children: i18n.gettext('Non-consensual image sharing'),
          },
          {
            value: 'non_consensual_items_deepfake',
            children: i18n.gettext(
              "Non-consensual items containing deepfake or similar technology using a third party's features",
            ),
          },
          {
            value: 'online_bullying_intimidation',
            children: i18n.gettext('Online bullying/intimidation'),
          },
          { value: 'stalking', children: i18n.gettext('Stalking') },
        ],
      );
      break;

    case 'pornography_or_sexualized_content':
      options.push(
        ...[
          {
            value: 'adult_sexual_material',
            children: i18n.gettext('Adult sexual material'),
          },
          {
            value: 'image_based_sexual_abuse',
            children: i18n.gettext(
              'Image-based sexual abuse (excluding content depicting minors)',
            ),
          },
        ],
      );
      break;

    case 'protection_of_minors':
      options.push(
        ...[
          {
            value: 'age_specific_restrictions_minors',
            children: i18n.gettext(
              'age-specific restrictions concerning minors',
            ),
          },
          {
            value: 'child_sexual_abuse_material',
            children: i18n.gettext('Child sexual abuse material'),
          },
          {
            value: 'grooming_sexual_enticement_minors',
            children: i18n.gettext('Grooming/sexual enticement of minors'),
          },
        ],
      );
      break;

    case 'risk_for_public_security':
      options.push(
        ...[
          {
            value: 'illegal_organizations',
            children: i18n.gettext('Illegal organizations'),
          },
          {
            value: 'risk_environmental_damage',
            children: i18n.gettext('Risk for environmental damage'),
          },
          {
            value: 'risk_public_health',
            children: i18n.gettext('Risk for public health'),
          },
          {
            value: 'terrorist_content',
            children: i18n.gettext('Terrorist content'),
          },
        ],
      );
      break;

    case 'scams_and_fraud':
      options.push(
        ...[
          {
            value: 'inauthentic_accounts',
            children: i18n.gettext('Inauthentic accounts'),
          },
          {
            value: 'inauthentic_listings',
            children: i18n.gettext('Inauthentic listings'),
          },
          {
            value: 'inauthentic_user_reviews',
            children: i18n.gettext('Inauthentic user reviews'),
          },
          {
            value: 'impersonation_account_hijacking',
            children: i18n.gettext('Impersonation or account hijacking'),
          },
          { value: 'phishing', children: i18n.gettext('Phishing') },
          {
            value: 'pyramid_schemes',
            children: i18n.gettext('Pyramid schemes'),
          },
        ],
      );
      break;

    case 'self_harm':
      options.push(
        ...[
          {
            value: 'content_promoting_eating_disorders',
            children: i18n.gettext('Content promoting eating disorders'),
          },
          {
            value: 'self_mutilation',
            children: i18n.gettext('Self-mutilation'),
          },
          { value: 'suicide', children: i18n.gettext('Suicide') },
        ],
      );
      break;

    case 'unsafe_and_prohibited_products':
      options.push(
        ...[
          {
            value: 'prohibited_products',
            children: i18n.gettext('Prohibited or restricted products'),
          },
          {
            value: 'unsafe_products',
            children: i18n.gettext('Unsafe or non-compliant products'),
          },
        ],
      );
      break;

    case 'violence':
      options.push(
        ...[
          {
            value: 'coordinated_harm',
            children: i18n.gettext('Coordinated harm'),
          },
          {
            value: 'gender_based_violence',
            children: i18n.gettext('Gender-based violence'),
          },
          {
            value: 'human_exploitation',
            children: i18n.gettext('Human exploitation'),
          },
          {
            value: 'human_trafficking',
            children: i18n.gettext('Human trafficking'),
          },
          {
            value: 'incitement_violence_hatred',
            children: i18n.gettext(
              'General calls or incitement to violence and/or hatred',
            ),
          },
        ],
      );
      break;

    default:
  }

  // Other should be listed for each category..
  options.push({ value: 'other', children: i18n.gettext('Something else') });

  return options;
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

    let newState = { [name]: newValue };
    // We should reset the illegal category/subcategory when the category
    // (reason) is no longer "illegal".
    if (name === 'category' && value !== CATEGORY_ILLEGAL) {
      newState = {
        ...newState,
        illegalCategory: null,
        illegalSubcategory: null,
      };
    } else if (name === 'illegalCategory') {
      // Some illegal categories do not have any sub-categories other than
      // "Something else" (other) so we set the subcategory to 'other' by
      // default here, and we'll hide the input field in the UI. Otherwise, we
      // reset the subcategory to make sure that the user always see "Select
      // violation" when the illegal category is updated.
      newState = {
        ...newState,
        illegalSubcategory: ILLEGAL_CATEGORIES_WITHOUT_SUBCATEGORIES.includes(
          value,
        )
          ? 'other'
          : null,
      };
    }

    this.setState(newState);
  };

  onSubmit: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();

    const {
      anonymous,
      email,
      name,
      text,
      category,
      location,
      illegalCategory,
      illegalSubcategory,
    } = this.state;

    this.props.onSubmit({
      anonymous,
      email,
      name,
      text,
      category,
      location,
      illegalCategory,
      illegalSubcategory,
    });
  };

  getFeedbackFormValues(currentUser: UserType | null): FeedbackFormValues {
    const defaultFormValues = {
      anonymous: false,
      email: '',
      name: '',
      text: '',
      category: null,
      location: null,
      illegalCategory: null,
      illegalSubcategory: null,
    };

    // `name` is either the `display_name` when set or `Firefox user XYZ`
    // (auto-generated) when the user hasn't chosen a display name yet.
    const { email, name } = currentUser || {};

    return {
      ...defaultFormValues,
      email: email || '',
      name: name || '',
    };
  }

  preventSubmit(): boolean {
    const { abuseIsLoading } = this.props;

    return abuseIsLoading;
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

  isLocationRequired(): boolean {
    return (
      this.props.showLocation &&
      ![CATEGORY_DOES_NOT_WORK, CATEGORY_FEEDBACK_SPAM].includes(
        this.state.category,
      )
    );
  }

  isCertificationRequired(): boolean {
    return [CATEGORY_ILLEGAL].includes(this.state.category);
  }

  renderCategories(title: string, categories: Array<Reason>): React.Node {
    const filteredCategories = categories.filter((category) =>
      this.props.categories.includes(category.value),
    );

    if (!filteredCategories.length) {
      return null;
    }

    return (
      <>
        <h3>{title}</h3>
        <ul>
          {filteredCategories.map((category) => (
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
                aria-describedby={`feedbackCategory${category.value}-help`}
                required
              />
              <label
                className="FeedbackForm-label"
                htmlFor={`feedbackCategory${category.value}`}
              >
                {category.label}
              </label>
              {category.help && (
                <p
                  className="FeedbackForm--help"
                  id={`feedbackCategory${category.value}-help`}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={sanitizeHTML(category.help, ['a'])}
                />
              )}
            </li>
          ))}
        </ul>
      </>
    );
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
              {this.renderCategories(feedbackTitle, feedback)}
              {this.renderCategories(reportTitle, report)}
            </Card>

            <Card
              className="FeedbackForm--Card"
              header={i18n.gettext('Provide more information')}
            >
              {this.isLocationRequired() && (
                <>
                  <label
                    className="FeedbackForm-label"
                    htmlFor="feedbackLocation"
                  >
                    {i18n.gettext('Place of the violation')}
                  </label>
                  <Select
                    className="FeedbackForm-location"
                    id="feedbackLocation"
                    name="location"
                    onChange={this.onFieldChange}
                    value={this.state.location}
                    required
                  >
                    {getLocationOptions(i18n).map((option) => {
                      return <option key={option.value} {...option} />;
                    })}
                  </Select>
                </>
              )}

              {this.state.category === CATEGORY_ILLEGAL && (
                <>
                  <label
                    className="FeedbackForm-label"
                    htmlFor="feedbackIllegalCategory"
                  >
                    {i18n.gettext('Type of illegal content')}
                  </label>
                  <Select
                    className="FeedbackForm-illegalCategory"
                    id="feedbackIllegalCategory"
                    name="illegalCategory"
                    onChange={this.onFieldChange}
                    value={this.state.illegalCategory}
                    required
                  >
                    {getIllegalCategoryOptions(i18n).map((option) => {
                      return <option key={option.value} {...option} />;
                    })}
                  </Select>
                </>
              )}

              {this.state.category === CATEGORY_ILLEGAL &&
                this.state.illegalCategory &&
                !ILLEGAL_CATEGORIES_WITHOUT_SUBCATEGORIES.includes(
                  this.state.illegalCategory,
                ) && (
                  <>
                    <label
                      className="FeedbackForm-label"
                      htmlFor="feedbackIllegalSubcategory"
                    >
                      {i18n.gettext('Specific violation')}
                    </label>
                    <Select
                      className="FeedbackForm-illegalSubcategory"
                      id="feedbackIllegalSubcategory"
                      name="illegalSubcategory"
                      onChange={this.onFieldChange}
                      value={this.state.illegalSubcategory}
                      required
                    >
                      {getIllegalSubcategoryOptions(
                        i18n,
                        this.state.illegalCategory,
                      ).map((option) => {
                        return <option key={option.value} {...option} />;
                      })}
                    </Select>
                  </>
                )}

              <label className="FeedbackForm-label" htmlFor="feedbackText">
                {i18n.gettext('Provide more details')}
              </label>
              <Textarea
                className="FeedbackForm-text"
                id="feedbackText"
                required
                name="text"
                onChange={this.onFieldChange}
                value={this.state.text}
                aria-describedby="feedbackText-help"
              />
              <p className="FeedbackForm--help" id="feedbackText-help">
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
                  aria-describedby="feedbackAnonymous-help"
                />
                <label
                  className="FeedbackForm-label"
                  htmlFor="feedbackAnonymous"
                >
                  {i18n.gettext('File report anonymously')}
                </label>
                <p className="FeedbackForm--help" id="feedbackAnonymous-help">
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
                {replaceStringsWithJSX({
                  text: this.state.anonymous
                    ? i18n.gettext(
                        'Your name %(spanStart)s(optional)%(spanEnd)s',
                      )
                    : i18n.gettext(
                        'Your name %(spanStart)s(required)%(spanEnd)s',
                      ),
                  replacements: [
                    [
                      'spanStart',
                      'spanEnd',
                      (text) => <span className="visually-hidden">{text}</span>,
                    ],
                  ],
                })}
              </label>
              <input
                className={makeClassName('FeedbackForm-name', {
                  'FeedbackForm-input--disabled': this.state.anonymous,
                })}
                id="feedbackName"
                name="name"
                disabled={!!currentUser || this.state.anonymous}
                onChange={this.onFieldChange}
                value={
                  this.state.anonymous
                    ? ''
                    : this.state.name || (currentUser && currentUser.name)
                }
                required={!this.state.anonymous}
                autoComplete="name"
              />

              <label
                className={makeClassName('FeedbackForm-label', {
                  'FeedbackForm-label--disabled': this.state.anonymous,
                })}
                htmlFor="feedbackEmail"
              >
                {replaceStringsWithJSX({
                  text: this.state.anonymous
                    ? i18n.gettext(
                        'Your email address %(spanStart)s(optional)%(spanEnd)s',
                      )
                    : i18n.gettext(
                        'Your email address %(spanStart)s(required)%(spanEnd)s',
                      ),
                  replacements: [
                    [
                      'spanStart',
                      'spanEnd',
                      (text) => <span className="visually-hidden">{text}</span>,
                    ],
                  ],
                })}
              </label>
              <input
                className={makeClassName('FeedbackForm-email', {
                  'FeedbackForm-input--disabled': this.state.anonymous,
                })}
                id="feedbackEmail"
                name="email"
                disabled={!!currentUser || this.state.anonymous}
                onChange={this.onFieldChange}
                value={
                  this.state.anonymous
                    ? ''
                    : this.state.email || (currentUser && currentUser.email)
                }
                required={!this.state.anonymous}
                autoComplete="email"
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
