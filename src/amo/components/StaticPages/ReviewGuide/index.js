import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Card from 'ui/components/Card';

import 'amo/components/StaticPages/StaticPages.scss';


export class ReviewGuideBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;

    /* eslint-disable react/no-danger */
    return (

      <Card
        className="ReviewGuidePage"
        header={i18n.gettext('Review Guidelines')}
      >
        <section>
          <p>
            {i18n.gettext(`Add-on reviews are a way for you to share your opinions about the add-ons you’ve installed and used. Our review moderation team reserves the right to refuse or remove any review that does not comply with these guidelines.`)}
          </p>
          <h2>{i18n.gettext('Some tips for writing a great review')}</h2>
          <dl className="staticSubHeading">{i18n.gettext('Do:')}</dl>
          <ul>
            <li>{i18n.gettext('Write like you are telling a friend about your experience with the add-on.')}</li>
            <li>{i18n.gettext('Keep reviews concise and easy to understand.')}</li>
            <li>{i18n.gettext('Give specific and helpful details. For example:')}
              <ul>
                <li>{i18n.gettext('Did the add-on work as you expected it to?')}</li>
                <li>{i18n.gettext('What features did you like or dislike?')}</li>
                <li>{i18n.gettext('Was it useful?')}</li>
                <li>{i18n.gettext('Was it easy to use?')}</li>
                <li>{i18n.gettext('Will you continue to use this add-on?')}</li>
              </ul>
            </li>
            <li>{i18n.gettext('Take a moment to read your review before submitting it to minimize typos.')}</li>
          </ul>
          <dl className="staticSubHeading">{i18n.gettext(`Don't:`)}</dl>
          <ul>
            <li>{i18n.gettext('Submit one-word reviews such as "Great!", "wonderful," or "bad." ')}</li>
            <li>{i18n.gettext('Post technical issues, support requests, or feature suggestions. Use the available support options for each add-on, if available. You can find them in the side column next to the About this Add-on section.')}</li>
            <li>{i18n.gettext('Write reviews for add-ons which you have not personally used.')}</li>
            <li>{i18n.gettext('Use profanity, sexual language or language that can be construed as hateful.')}</li>
            <li>{i18n.gettext('Include HTML, links, source code or code snippets. Reviews are meant to be text only.')}</li>
            <li>{i18n.gettext('Make false statements, disparage add-on authors or personally insult them.')}</li>
            <li>{i18n.gettext('Include your own or anyone else’s email, phone number, or other personal details.')}</li>
            <li>{i18n.gettext('Post reviews for an add-on you or your organization wrote or represent.')}</li>
            <li>{i18n.gettext('Criticize an add-on for something it’s intended to do. For example, leaving a negative review of an add-on for displaying ads or requiring data gathering, when that is the intended purpose of the add-on, or the add-on requires gathering data to function.')}</li>
          </ul>
        </section>
        <section>
          <h2>{i18n.gettext('Frequently Asked Questions about Reviews')}</h2>
          <dl>
            <dt className="staticSubHeading">{i18n.gettext('How can I report a problematic review?')}</dt>
            <dd>
              <p>{i18n.gettext('Please report or flag any questionable reviews by clicking the "Report this review" and it will be submitted to the site for moderation. Our moderation team will use the Review Guidelines to evaluate whether or not to delete the review or restore it back to the site.')}</p>
            </dd>
          </dl>
          <dl>
            <dt className="staticSubHeading">{i18n.gettext(`I'm an add-on author, can I respond to reviews?`)}</dt>
            <dd>
              <p
                dangerouslySetInnerHTML={sanitizeHTML(i18n.sprintf(i18n.gettext(`Yes, add-on authors can provide a single response to a review.
                You can set up a discussion topic in our %(url)s to engage in additional discussion or follow-up.`),
                {
                  url: '<a href="https://discourse.mozilla-community.org/c/add-ons/add-on-support">forum</a>',
                }), ['a'])}
              />
            </dd>
          </dl>
          <dl>
            <dt className="staticSubHeading">{i18n.gettext(`I'm an add-on author, can I delete unfavorable reviews or ratings?`)}</dt>
            <dd>
              <p>{i18n.gettext('In general, no. But if the review did not meet the review guidelines outlined above, you can click "Report this review" and have it moderated. If a review included a complaint that is no longer valid due to a new release of your add-on, we may consider deleting the review.')}</p>
            </dd>
          </dl>
        </section>
      </Card>
    );
  }
}

export default compose(
  translate(),
)(ReviewGuideBase);
