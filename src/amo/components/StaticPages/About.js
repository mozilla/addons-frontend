import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import React from 'react';
import { compose } from 'redux';

import Card from 'ui/components/Card';
import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';

import 'amo/components/StaticPages/StaticPages.scss';


export class AboutBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;

    return (

      <Card
        className="StaticPage"
        header={i18n.gettext('About Mozilla Add-ons')}
      >
        <Helmet>
          <title>{i18n.gettext('About')}</title>
        </Helmet>

        <section id="about">
          <h2>{i18n.gettext('What is this website?')}</h2>
          <p>
            {i18n.gettext(`addons.mozilla.org, commonly known as "AMO", is
              Mozilla's official site for add-ons to Mozilla software, such as
              Firefox and Firefox for Android. Add-ons let you add new features
              and change the way your browser or application works. Take a look
              around and explore the thousands of ways to customize the way you
              do things online.`)}
          </p>
        </section>
        <section>
          <h2>{i18n.gettext('Who creates these add-ons?')}</h2>
          <p>
            {i18n.gettext(`The add-ons listed here have been created by
              thousands of developers from our community, ranging from
              individual hobbyists to large corporations. All publicly
              listed add-ons are reviewed by a team of editors before
              being released. Add-ons marked as Experimental have not
              been reviewed and should only be installed with caution.`)}
          </p>
        </section>
        <section>
          <h2>{i18n.gettext(`How do I keep up with what's happening at AMO?`)}</h2>
          <p>
            {i18n.gettext(`There are several ways to find out the latest news from
              the world of add-ons:`)}
          </p>
          <ul>
            <li
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={
                sanitizeHTML(
                  i18n.sprintf(
                    i18n.gettext(`Our %(startLink)sAdd-ons Blog%(endLink)s
                      is regularly updated with information for both add-on
                      enthusiasts and developers.`),
                    { startLink: '<a href="https://blog.mozilla.com/addons/">', endLink: '</a>' }
                  ), ['a'])
              }
            />
            <li
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={
                sanitizeHTML(
                  i18n.sprintf(
                    i18n.gettext(`We often post news, tips, and tricks to our Twitter account,
                      %(startLink)smozamo%(endLink)s`),
                    { startLink: '<a href="https://twitter.com/mozamo">', endLink: '</a>' }
                  ), ['a'])
              }
            />
            <li
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={
                sanitizeHTML(
                  i18n.sprintf(
                    i18n.gettext(`Our %(startLink)sforums%(endLink)s are a good place to
                      interact with the add-ons community and discuss upcoming changes to AMO.`),
                    { startLink: '<a href="https://discourse.mozilla-community.org/c/add-ons">', endLink: '</a>' }
                  ), ['a'])
              }
            />
          </ul>
        </section>
        <section>
          <h2>{i18n.gettext('This sounds great! How can I get involved?')}</h2>
          <p>{i18n.gettext(`There are plenty of ways to get involved. If you're on the technical side:`)}</p>
          <ul>
            <li>
              <Link to={'/developers'}>{i18n.gettext('Make your own add-on.')}</Link>
              <span> {i18n.gettext('We provide free hosting and update services and can help you reach a large audience of users.')}</span>
            </li>
            <li
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={
                sanitizeHTML(
                  i18n.sprintf(
                    i18n.gettext(`If you have add-on development experience,
                      %(startLink)sbecome an Add-on Reviewer%(endLink)s! Our reviewers are add-on fans
                      with a technical background who review add-ons for code quality and stability.`),
                    { startLink: '<a href="https://wiki.mozilla.org/Add-ons/Reviewers/Applying">', endLink: '</a>' }
                  ), ['a'])
              }
            />
            <li
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={
                sanitizeHTML(
                  i18n.sprintf(
                    i18n.gettext(`Help improve this website. It's open source, and you can file bugs
                      and submit patches. %(github)s contains all of our current bugs, legacy bugs can
                      still be found in Bugzilla.`),
                    { github: '<a href="https://github.com/mozilla/olympia/issues">GitHub</a>' }
                  ), ['a'])
              }
            />
          </ul>
          <p>{i18n.gettext(`If you're interested in add-ons but not quite as technical, there are still ways to help:`)}</p>
          <ul>
            <li>{i18n.gettext('Tell your friends! Let people know which add-ons you use.')}</li>
            <li
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={
                sanitizeHTML(
                  i18n.sprintf(
                    i18n.gettext(`Participate in our %(startLink)sforums%(endLink)s.`),
                    { startLink: '<a href="https://discourse.mozilla-community.org/c/add-ons">', endLink: '</a>' }
                  ), ['a'])
              }
            />
            <li>
              {i18n.gettext(`Review add-ons on the site. Add-on authors are more likely to
                improve their add-ons and write new ones when they know people appreciate their work.`)}
            </li>
          </ul>
        </section>
        <section>
          <h2>{i18n.gettext('I have a question')}</h2>
          <p
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={
              sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext('A good place to start is our %(startLink)sforums%(endLink)s.'),
                  { startLink: '<a href="https://discourse.mozilla-community.org/c/add-ons">', endLink: '</a>' }
                ), ['a'])
            }
          />
          <p
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={
              sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(`If you really need to contact someone from the Mozilla team,
                    please see our %(startLink)scontact information%(endLink)s page.`),
                  { startLink: '<a href="https://developer.mozilla.org/en-US/Add-ons#Contact_us">', endLink: '</a>' }
                ), ['a'])
            }
          />
        </section>
      </Card>
    );
  }
}

export default compose(
  translate(),
)(AboutBase);
