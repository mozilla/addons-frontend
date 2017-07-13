import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

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
          <h2>{i18n.gettext('How do I keep up with what\'s happening at AMO?')}</h2>
          <p>
            {i18n.gettext('There are several ways to find out the latest news from the world of add-ons:')}
          </p>
          <ul>
            <li>
              {i18n.gettext('Our')}&nbsp;
              <a href={'http://blog.mozilla.com/addons/'}>{i18n.gettext('Add-ons Blog')}</a>&nbsp;
              {i18n.gettext('is regularly updated with information for both add-on enthusiasts and developers.')}
            </li>
            <li>
              {i18n.gettext('We often post news, tips, and tricks to our Twitter account,')}&nbsp;
              <a href={'http://twitter.com/mozamo'}>{i18n.gettext('mozamo')}</a>
            </li>
            <li>
              {i18n.gettext('Our')}&nbsp;
              <a href={'https://discourse.mozilla-community.org/c/add-ons'}>{i18n.gettext('forums')}</a>&nbsp;
              {i18n.gettext('are a good place to interact with the add-ons community and discuss upcoming changes to AMO.')}
            </li>
          </ul>
        </section>
        <section>
          <h2>{i18n.gettext('This sounds great! How can I get involved?')}</h2>
          <p>{i18n.gettext('There are plenty of ways to get involved. If you\'re on the technical side:')}
            <ul>
              <li>
                <Link to={'/developers'}>{i18n.gettext('Make your own add-on')}</Link>&nbsp;
                {i18n.gettext('We provide free hosting and update services and can help you reach a large audience of users.')}
              </li>
              <li>
                {i18n.gettext('If you have add-on development experience,')}&nbsp;
                <a href="https://wiki.mozilla.org/Add-ons/Reviewers/Applying">{i18n.gettext('become an Add-on Reviewer')}</a>!&nbsp;
                {i18n.gettext('Our reviewers are add-on fans with a technical background who review add-ons for code quality and stability.')}
              </li>
              <li>
                {i18n.gettext('Help improve this website. It\'s open source, and you can file bugs and submit patches.')}&nbsp; <a href="https://github.com/mozilla/olympia/issues"> {i18n.gettext('GitHub')}</a>&nbsp;
                {i18n.gettext('contains all of our current bugs, legacy bugs can still be found in Bugzilla.')}
              </li>
            </ul>
          </p>
          <p>{i18n.gettext('If you\'re interested in add-ons but not quite as technical, there are still ways to help:')}</p>
          <ul>
            <li>{i18n.gettext('Tell your friends! Let people know which add-ons you use.{% endtrans')}</li>
            <li>{i18n.gettext('Participate in our')}&nbsp;
              <a href="https://discourse.mozilla-community.org/c/add-ons">{i18n.gettext('forums')}</a>.
            </li>
            <li>
              {i18n.gettext('Review add-ons on the site. Add-on authors are more likely to improve their add-ons and write new ones when they know people appreciate their work.')}
            </li>
          </ul>
        </section>
        <section>
          <h2>{i18n.gettext('I have a question')}</h2>
          <p>{i18n.gettext('A good place to start is our')}&nbsp;
            <Link to="/faq"><abbr title="{i18n.gettext('Frequently Asked Questions')}">{i18n.gettext('FAQ')}</abbr></Link>.&nbsp;
            {i18n.gettext('If you don\'t find an answer there, you can')}&nbsp;<a href="https://discourse.mozilla-community.org/c/add-ons"> {i18n.gettext('ask on our forums')}</a>.
          </p>
          <p>{i18n.gettext('If you really need to contact someone from the Mozilla team, please see our')}&nbsp;
            <Link to="/developers/docs/policies/contact">{i18n.gettext('contact information')}</Link> {i18n.gettext('page.')}
          </p>
        </section>
        <section>
          <h2>{i18n.gettext('Who works on this website?')}</h2>
          <p>{i18n.gettext('Over the years, many people have contributed to this website, including both volunteers from the community and a dedicated AMO team. A list of significant contributors can be found on our ')}&nbsp;
            <Link to="/pages/credits">{i18n.gettext('Site Credits')}</Link> &nbsp;{i18n.gettext('page')}.
          </p>
        </section>
      </Card>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(AboutBase);
