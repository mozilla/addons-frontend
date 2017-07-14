import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import { sanitizeHTML } from 'core/utils';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import Link from 'amo/components/Link';

import 'amo/components/StaticPages/StaticPages.scss';


export class AboutBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;

    const whatsHappening1 = i18n.sprintf(i18n.gettext('Our <a href="%(url)s"> Add-ons Blog</a> is regularly updated with information for both add-on enthusiasts and developers.'), { url: 'http://blog.mozilla.com/addons/' });
    const whatsHappening2 = i18n.sprintf(i18n.gettext('We often post news, tips, and tricks to our Twitter account, <a href="%(url)s"> mozamo</a>'), { url: 'http://twitter.com/mozamo' });
    const whatsHappening3 = i18n.sprintf(i18n.gettext('Our <a href="%(url)s">forums</a> are a good place to interact with the add-ons community and discuss upcoming changes to AMO.'), { url: 'https://discourse.mozilla-community.org/c/add-ons' });

    const getInvolved1 = i18n.sprintf(i18n.gettext('<Link to="%(url)s">Make your own add-on</Link> We provide free hosting and update services and can help you reach a large audience of users.'), { url:'/developers' });
    const getInvolved2 = i18n.sprintf(i18n.gettext('If you have add-on development experience, <a href="%(url)s">become an Add-on Reviewer</a>! Our reviewers are add-on fans with a technical background who review add-ons for code quality and stability.'), { url: 'https://wiki.mozilla.org/Add-ons/Reviewers/Applying' });
    const getInvolved3 = i18n.sprintf(i18n.gettext('Help improve this website. It\'s open source, and you can file bugs and submit patches. <a href="%(url)s">GitHub</a> contains all of our current bugs, legacy bugs can still be found in Bugzilla.'), { url: 'https://github.com/mozilla/addons-server/issues'});
    const getInvolved4 = i18n.sprintf(i18n.gettext('Participate in our <a href="%(url)s">forums</a>.'), { url: 'https://discourse.mozilla-community.org/c/add-ons'});

    const question1 = i18n.sprintf(i18n.gettext('A good place to start is our <a href="%(urlFaq)s"><abbr title="%(titleText)s">FAQ</abbr></a>. If you don\'t find an answer there, you can <a href="%(urlForum)s">ask on our forums</a>.'), { urlFaq: 'faq', titleText: 'Frequently Asked Questions', urlForum: 'https://discourse.mozilla-community.org/c/add-ons' });

    const question2 = i18n.sprintf(i18n.gettext('If you really need to contact someone from the Mozilla team, please see our <a href="%(url)s">contact information</a> page.'), { url: '/developers/docs/policies/contact'});

    const whoWorks = i18n.sprintf(i18n.gettext('Over the years, many people have contributed to this website, including both volunteers from the community and a dedicated AMO team. A list of significant contributors can be found on our <a href="%(url)s">Site Credits</a> page.'), { url: 'pages/credits'});

    return (

      <Card
        className="AboutPage"
        header={i18n.gettext('About Mozilla Add-ons')}
      >
        <section>
          <h2>{i18n.gettext('What is this website?')}</h2>
          <p>
            {i18n.gettext('addons.mozilla.org, commonly known as "AMO", is Mozilla\'s official site for add-ons to Mozilla software, such as Firefox, Thunderbird, and SeaMonkey. Add-ons let you add new features and change the way your browser or application works. Take a look around and explore the thousands of ways to customize the way you do things online.')}
          </p>
        </section>
        <section>
          <h2>{i18n.gettext('Who creates these add-ons?')}</h2>
          <p>
            {i18n.gettext('The add-ons listed here have been created by thousands of developers from our community, ranging from individual hobbyists to large corporations. All publicly listed add-ons are reviewed by a team of editors before being released. Add-ons marked as Experimental have not been reviewed and should only be installed with caution.')}
          </p>
        </section>
        <section>
          <h2>{i18n.gettext(`How do I keep up with what\'s happening at AMO?`)}</h2>
          <p>
            {i18n.gettext('There are several ways to find out the latest news from the world of add-ons:')}
          </p>
          <ul>
            <li dangerouslySetInnerHTML={sanitizeHTML(whatsHappening1, ['a'])} />
            <li dangerouslySetInnerHTML={sanitizeHTML(whatsHappening2, ['a'])} />
            <li dangerouslySetInnerHTML={sanitizeHTML(whatsHappening3, ['a'])} />
          </ul>
        </section>
        <section>
          <h2>{i18n.gettext('This sounds great! How can I get involved?')}</h2>
          <p>{i18n.gettext('There are plenty of ways to get involved. If you\'re on the technical side:')}
            <ul>
              <li dangerouslySetInnerHTML={sanitizeHTML(getInvolved1, ['Link'])} />
              <li dangerouslySetInnerHTML={sanitizeHTML(getInvolved2, ['a'])} />
              <li dangerouslySetInnerHTML={sanitizeHTML(getInvolved3, ['a'])} />
            </ul>
          </p>
          <p>{i18n.gettext('If you\'re interested in add-ons but not quite as technical, there are still ways to help:')}</p>
          <ul>
            <li>{i18n.gettext('Tell your friends! Let people know which add-ons you use.')}</li>
            <li dangerouslySetInnerHTML={sanitizeHTML(getInvolved4, ['a'])} />
            <li>
              {i18n.gettext('Review add-ons on the site. Add-on authors are more likely to improve their add-ons and write new ones when they know people appreciate their work.')}
            </li>
          </ul>
        </section>
        <section>
          <h2>{i18n.gettext('I have a question')}</h2>
          <p dangerouslySetInnerHTML={sanitizeHTML(question1, ['a'])} />
          <p dangerouslySetInnerHTML={sanitizeHTML(question2, ['a'])} />
        </section>
        <section>
          <h2>{i18n.gettext('Who works on this website?')}</h2>
          <p dangerouslySetInnerHTML={sanitizeHTML(whoWorks, ['a'])} />
        </section>
      </Card>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(AboutBase);
