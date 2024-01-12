/* @flow */
import * as React from 'react';

import StaticPage from 'amo/components/StaticPage';
import translate from 'amo/i18n/translate';
import { sanitizeHTML } from 'amo/utils';
import type { I18nType } from 'amo/types/i18n';

type Props = {|
  jed: I18nType,
|};

export class ReviewGuideBase extends React.Component<Props> {
  render(): React.Node {
    const { jed } = this.props;

    return (
      <StaticPage
        title={jed.gettext('Review Guidelines')}
        metaDescription={jed.gettext(`
          Guidelines, tips, and Frequently Asked Questions to leave a review for the extensions and
          themes you’ve downloaded and used on Firefox.
        `)}
      >
        <>
          <section id="review-guide">
            <p>
              {jed.gettext(`Add-on reviews are a way for you to share your opinions
                about the add-ons you’ve installed and used. Our review moderation
                team reserves the right to refuse or remove any review that does not
                comply with these guidelines.`)}
            </p>
            <h2>{jed.gettext('Tips for writing a great review')}</h2>
            <h3>{jed.gettext('Do:')}</h3>
            <ul>
              <li>
                {jed.gettext(
                  'Write like you are telling a friend about your experience with the add-on.',
                )}
              </li>
              <li>
                {jed.gettext('Keep reviews concise and easy to understand.')}
              </li>
              <li>
                {jed.gettext('Give specific and helpful details. For example:')}
                <ul>
                  <li>
                    {jed.gettext('Did the add-on work as you expected it to?')}
                  </li>
                  <li>
                    {jed.gettext('What features did you like or dislike?')}
                  </li>
                  <li>{jed.gettext('Was it useful?')}</li>
                  <li>{jed.gettext('Was it easy to use?')}</li>
                  <li>
                    {jed.gettext('Will you continue to use this add-on?')}
                  </li>
                </ul>
              </li>
              <li>
                {jed.gettext(
                  'Take a moment to read your review before submitting it to minimize typos.',
                )}
              </li>
            </ul>
            <h3>{jed.gettext(`Don't:`)}</h3>
            <ul>
              <li>
                {jed.gettext(
                  'Submit one-word reviews such as "Great!", "wonderful," or "bad".',
                )}
              </li>
              <li>
                {jed.gettext(`Post technical issues, support requests, or feature suggestions. Use
                the available support options for each add-on, if available. You can find them in
                the "More information" section in the sidebar on the add-on's detail page.`)}
              </li>
              <li>
                {jed.gettext(
                  'Write reviews for add-ons which you have not personally used.',
                )}
              </li>
              <li>
                {jed.gettext(
                  'Use profanity, sexual language or language that can be construed as hateful.',
                )}
              </li>
              <li>
                {jed.gettext(
                  'Include HTML, links, source code or code snippets. Reviews are meant to be text only.',
                )}
              </li>
              <li>
                {jed.gettext(
                  'Make false statements, disparage add-on authors or personally insult them.',
                )}
              </li>
              <li>
                {jed.gettext(
                  'Include your own or anyone else’s email, phone number, or other personal details.',
                )}
              </li>
              <li>
                {jed.gettext(
                  'Post reviews for an add-on you or your organization wrote or represent.',
                )}
              </li>
              <li>
                {jed.gettext(`Criticize an add-on for something it’s intended to do. For example,
                leaving a negative review of an add-on for displaying ads or requiring data
                gathering, when that is the intended purpose of the add-on, or the add-on
                requires gathering data to function.`)}
              </li>
            </ul>
          </section>

          <section>
            <h2>{jed.gettext('Frequently Asked Questions about Reviews')}</h2>

            <h3>{jed.gettext('How can I report a problematic review?')}</h3>
            <p>
              {jed.gettext(`Please report or flag any questionable reviews by clicking the
              "Report this review" and it will be submitted to the site for moderation. Our
              moderation team will use the Review Guidelines to evaluate whether or not to
              delete the review or restore it back to the site.`)}
            </p>

            <h3>
              {jed.gettext(`I'm an add-on author, can I respond to reviews?`)}
            </h3>
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                jed.sprintf(
                  jed.gettext(`Yes, add-on authors can provide a single response to a review.
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
              {jed.gettext(
                `I'm an add-on author, can I delete unfavorable reviews or ratings?`,
              )}
            </h3>
            <p>
              {jed.gettext(`In general, no. But if the review did not meet the review guidelines
              outlined above, you can click "Report this review" and have it moderated. If a review
              included a complaint that is no longer valid due to a new release of your add-on, we
              may consider deleting the review.`)}
            </p>
          </section>
        </>
      </StaticPage>
    );
  }
}

export default (translate()(ReviewGuideBase): React.ComponentType<Props>);
