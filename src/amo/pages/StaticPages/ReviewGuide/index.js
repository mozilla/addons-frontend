/* @flow */
import config from 'config';
import Helmet from 'react-helmet';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { getCanonicalURL } from 'amo/utils';
import Card from 'ui/components/Card';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';

import '../styles.scss';

type Props = {|
  _config: typeof config,
  i18n: I18nType,
  locationPathname: string,
|};

export class ReviewGuideBase extends React.Component<Props> {
  static defaultProps = {
    _config: config,
  };

  render() {
    const { _config, i18n, locationPathname } = this.props;

    return (
      <Card className="StaticPage" header={i18n.gettext('Review Guidelines')}>
        <Helmet>
          <title>{i18n.gettext('Review Guidelines')}</title>
          <link
            rel="canonical"
            href={getCanonicalURL({ locationPathname, _config })}
          />
        </Helmet>

        <div className="StaticPageWrapper">
          <section id="review-guide">
            <p>
              {i18n.gettext(`Add-on reviews are a way for you to share your opinions
                about the add-ons you’ve installed and used. Our review moderation
                team reserves the right to refuse or remove any review that does not
                comply with these guidelines.`)}
            </p>
            <h2>{i18n.gettext('Tips for writing a great review')}</h2>
            <h3>{i18n.gettext('Do:')}</h3>
            <ul>
              <li>
                {i18n.gettext(
                  'Write like you are telling a friend about your experience with the add-on.',
                )}
              </li>
              <li>
                {i18n.gettext('Keep reviews concise and easy to understand.')}
              </li>
              <li>
                {i18n.gettext(
                  'Give specific and helpful details. For example:',
                )}
                <ul>
                  <li>
                    {i18n.gettext('Did the add-on work as you expected it to?')}
                  </li>
                  <li>
                    {i18n.gettext('What features did you like or dislike?')}
                  </li>
                  <li>{i18n.gettext('Was it useful?')}</li>
                  <li>{i18n.gettext('Was it easy to use?')}</li>
                  <li>
                    {i18n.gettext('Will you continue to use this add-on?')}
                  </li>
                </ul>
              </li>
              <li>
                {i18n.gettext(
                  'Take a moment to read your review before submitting it to minimize typos.',
                )}
              </li>
            </ul>
            <h3>{i18n.gettext(`Don't:`)}</h3>
            <ul>
              <li>
                {i18n.gettext(
                  'Submit one-word reviews such as "Great!", "wonderful," or "bad".',
                )}
              </li>
              <li>
                {i18n.gettext(`Post technical issues, support requests, or feature suggestions. Use
                the available support options for each add-on, if available. You can find them in
                the "More information" section in the sidebar on the add-on's detail page.`)}
              </li>
              <li>
                {i18n.gettext(
                  'Write reviews for add-ons which you have not personally used.',
                )}
              </li>
              <li>
                {i18n.gettext(
                  'Use profanity, sexual language or language that can be construed as hateful.',
                )}
              </li>
              <li>
                {i18n.gettext(
                  'Include HTML, links, source code or code snippets. Reviews are meant to be text only.',
                )}
              </li>
              <li>
                {i18n.gettext(
                  'Make false statements, disparage add-on authors or personally insult them.',
                )}
              </li>
              <li>
                {i18n.gettext(
                  'Include your own or anyone else’s email, phone number, or other personal details.',
                )}
              </li>
              <li>
                {i18n.gettext(
                  'Post reviews for an add-on you or your organization wrote or represent.',
                )}
              </li>
              <li>
                {i18n.gettext(`Criticize an add-on for something it’s intended to do. For example,
                leaving a negative review of an add-on for displaying ads or requiring data
                gathering, when that is the intended purpose of the add-on, or the add-on
                requires gathering data to function.`)}
              </li>
            </ul>
          </section>

          <section>
            <h2>{i18n.gettext('Frequently Asked Questions about Reviews')}</h2>

            <h3>{i18n.gettext('How can I report a problematic review?')}</h3>
            <p>
              {i18n.gettext(`Please report or flag any questionable reviews by clicking the
              "Report this review" and it will be submitted to the site for moderation. Our
              moderation team will use the Review Guidelines to evaluate whether or not to
              delete the review or restore it back to the site.`)}
            </p>

            <h3>
              {i18n.gettext(`I'm an add-on author, can I respond to reviews?`)}
            </h3>
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(`Yes, add-on authors can provide a single response to a review.
                      You can set up a discussion topic in our %(startLink)sforum%(endLink)s to engage in additional
                      discussion or follow-up.`),
                  {
                    startLink:
                      '<a href="https://discourse.mozilla-community.org/c/add-ons/add-on-support">',
                    endLink: '</a>',
                  },
                ),
                ['a'],
              )}
            />

            <h3>
              {i18n.gettext(
                `I'm an add-on author, can I delete unfavorable reviews or ratings?`,
              )}
            </h3>
            <p>
              {i18n.gettext(`In general, no. But if the review did not meet the review guidelines
              outlined above, you can click "Report this review" and have it moderated. If a review
              included a complaint that is no longer valid due to a new release of your add-on, we
              may consider deleting the review.`)}
            </p>
          </section>
        </div>
      </Card>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    locationPathname: state.router.location.pathname,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
)(ReviewGuideBase);
