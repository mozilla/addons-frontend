/* @flow */
import * as React from 'react';

import StaticPage from 'amo/components/StaticPage';
import translate from 'amo/i18n/translate';
import { sanitizeHTML } from 'amo/utils';
import type { I18nType } from 'amo/types/i18n';

type Props = {|
  i18n: I18nType,
|};

export class ReviewGuideBase extends React.Component<Props> {
  render(): React.Node {
    const { i18n } = this.props;

    return (
      <StaticPage
        title={i18n.t('Review Guidelines')}
        metaDescription={i18n.t(
          'Guidelines, tips, and Frequently Asked Questions to leave a review for the extensions and themes you\u2019ve downloaded and used on Firefox.',
        )}
      >
        <>
          <section id="review-guide">
            <p>
              {i18n.t(
                'Add-on reviews are a way for you to share your opinions about the add-ons you\u2019ve installed and used. Our review moderation team reserves the right to refuse or remove any review that does not comply with these guidelines.',
              )}
            </p>
            <h2>{i18n.t('Tips for writing a great review')}</h2>
            <h3>{i18n.t('Do:')}</h3>
            <ul>
              <li>
                {i18n.t(
                  'Write like you are telling a friend about your experience with the add-on.',
                )}
              </li>
              <li>{i18n.t('Keep reviews concise and easy to understand.')}</li>
              <li>
                {i18n.t('Give specific and helpful details. For example:')}
                <ul>
                  <li>
                    {i18n.t('Did the add-on work as you expected it to?')}
                  </li>
                  <li>{i18n.t('What features did you like or dislike?')}</li>
                  <li>{i18n.t('Was it useful?')}</li>
                  <li>{i18n.t('Was it easy to use?')}</li>
                  <li>{i18n.t('Will you continue to use this add-on?')}</li>
                </ul>
              </li>
              <li>
                {i18n.t(
                  'Take a moment to read your review before submitting it to minimize typos.',
                )}
              </li>
            </ul>
            <h3>{i18n.t("Don't:")}</h3>
            <ul>
              <li>
                {i18n.t(
                  'Submit one-word reviews such as "Great!", "wonderful," or "bad".',
                )}
              </li>
              <li>
                {i18n.t(
                  'Post technical issues, support requests, or feature suggestions. Use the available support options for each add-on, if available. You can find them in the "More information" section in the sidebar on the add-on\'s detail page.',
                )}
              </li>
              <li>
                {i18n.t(
                  'Write reviews for add-ons which you have not personally used.',
                )}
              </li>
              <li>
                {i18n.t(
                  'Use profanity, sexual language or language that can be construed as hateful.',
                )}
              </li>
              <li>
                {i18n.t(
                  'Include HTML, links, source code or code snippets. Reviews are meant to be text only.',
                )}
              </li>
              <li>
                {i18n.t(
                  'Make false statements, disparage add-on authors or personally insult them.',
                )}
              </li>
              <li>
                {i18n.t(
                  'Include your own or anyone else’s email, phone number, or other personal details.',
                )}
              </li>
              <li>
                {i18n.t(
                  'Post reviews for an add-on you or your organization wrote or represent.',
                )}
              </li>
              <li>
                {i18n.t(
                  'Criticize an add-on for something it\u2019s intended to do. For example, leaving a negative review of an add-on for displaying ads or requiring data gathering, when that is the intended purpose of the add-on, or the add-on requires gathering data to function.',
                )}
              </li>
            </ul>
          </section>

          <section>
            <h2>{i18n.t('Frequently Asked Questions about Reviews')}</h2>

            <h3>{i18n.t('How can I report a problematic review?')}</h3>
            <p>
              {i18n.t(
                'Please report or flag any questionable reviews by clicking the "Report this review" and it will be submitted to the site for moderation. Our moderation team will use the Review Guidelines to evaluate whether or not to delete the review or restore it back to the site.',
              )}
            </p>

            <h3>{i18n.t("I'm an add-on author, can I respond to reviews?")}</h3>
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.t(
                  'Yes, add-on authors can provide a single response to a review. You can set up a discussion topic in our %(startLink)sforum%(endLink)s to engage in additional discussion or follow-up.',

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
              {i18n.t(
                "I'm an add-on author, can I delete unfavorable reviews or ratings?",
              )}
            </h3>
            <p>
              {i18n.t(
                'In general, no. But if the review did not meet the review guidelines outlined above, you can click "Report this review" and have it moderated. If a review included a complaint that is no longer valid due to a new release of your add-on, we may consider deleting the review.',
              )}
            </p>
          </section>
        </>
      </StaticPage>
    );
  }
}

export default (translate()(ReviewGuideBase): React.ComponentType<Props>);
