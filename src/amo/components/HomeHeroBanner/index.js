/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Hero from 'ui/components/Hero';
import HeroSection from 'ui/components/HeroSection';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  i18n: I18nType,
|};

export class HomeHeroBannerBase extends React.Component<Props> {
  sections() {
    const { i18n } = this.props;

    const heroes = [
      {
        title: i18n.gettext('Facebook Container'),
        description: i18n.gettext(
          'Prevent Facebook from tracking you around the web',
        ),
        url: '/addon/facebook-container/',
      },
      {
        title: i18n.gettext('Midnight Lizard'),
        description: i18n.gettext('Give the entire internet a new look'),
        url: '/addon/midnight-lizard-quantum/',
      },
      {
        title: i18n.gettext('Turbo Download Manager'),
        description: i18n.gettext(
          'Increase download speeds with multi-threading support',
        ),
        url: '/addon/turbo-download-manager/',
      },
      {
        title: i18n.gettext('Authenticator'),
        description: i18n.gettext(
          'Generate 2-step verification codes right in Firefox',
        ),
        url: '/addon/auth-helper/',
      },
      {
        title: i18n.gettext('IP Address and Domain Information'),
        description: i18n.gettext(
          'See detailed info about every website you visit—IP address, location, provider & more',
        ),
        url: '/addon/ip-address-and-domain-info/',
      },
      {
        title: i18n.gettext('New Tab Override'),
        description: i18n.gettext(
          'Choose the page you see every time you open a new tab',
        ),
        url: '/addon/new-tab-override/',
      },
      {
        title: i18n.gettext('Forecastfox'),
        description: i18n.gettext(
          'Get instant global weather information right in Firefox',
        ),
        url: '/addon/forecastfox-fix-version/',
      },
      {
        title: i18n.gettext('Multi-Account Containers'),
        description: i18n.gettext(
          'Keep different parts of your online life—work, personal, etc.—separated by color-coded tabs',
        ),
        url: '/addon/multi-account-containers/',
      },
      {
        title: i18n.gettext('Transparent Standalone Images'),
        description: i18n.gettext('Render images on transparent backgrounds'),
        url: '/addon/transparent-standalone-image/',
      },
      {
        title: i18n.gettext('Tabliss'),
        description: i18n.gettext(
          'Enjoy a gorgeous new tab page with customizable backgrounds, local weather & more',
        ),
        url: '/addon/tabliss/',
      },
      {
        title: i18n.gettext('Tree Style Tab'),
        description: i18n.gettext(
          'Have a ton of open tabs? Organize them in a tidy sidebar',
        ),
        url: '/addon/tree-style-tab/',
      },
      {
        title: i18n.gettext('Imagus'),
        description: i18n.gettext(
          'Enlarge images by hovering your mouse over it',
        ),
        url: '/addon/imagus/',
      },
      {
        title: i18n.gettext('Privacy Possum'),
        description: i18n.gettext(
          'Protect yourself against the sneakiest trackers',
        ),
        url: '/addon/privacy-possum/',
      },
      {
        title: i18n.gettext('Default Bookmark Folder'),
        description: i18n.gettext(
          'Change the default destination for your bookmarks',
        ),
        url: '/addon/default-bookmark-folder/',
      },
      {
        title: i18n.gettext('Textmarker'),
        description: i18n.gettext('Highly customizable text highlighter'),
        url: '/addon/textmarkerpro/',
      },
      {
        title: i18n.gettext('Watch2Gether'),
        description: i18n.gettext('Watch videos simultaneously with others'),
        url: '/addon/w2g/',
      },
      {
        title: i18n.gettext('Context Search'),
        description: i18n.gettext(
          'Highlight text on any webpage to easily search the term',
        ),
        url: '/addon/contextual-search/',
      },
      {
        title: i18n.gettext('Stylus'),
        description: i18n.gettext('Give your favorite websites a new look'),
        url: '/addon/styl-us/',
      },
      {
        title: i18n.gettext('Search Encrypt'),
        description: i18n.gettext('Privacy protection for your search data'),
        url: '/addon/search-encrypt/',
      },
      {
        title: i18n.gettext('Auto Tab Discard'),
        description: i18n.gettext('Save memory by disabling inactive tabs'),
        url: '/addon/auto-tab-discard/',
      },
      {
        title: i18n.gettext('Update Scanner'),
        description: i18n.gettext(
          'Get notified when your selected websites update with new content',
        ),
        url: '/addon/update-scanner/',
      },
      {
        title: i18n.gettext('Auto Fullscreen'),
        description: i18n.gettext(
          'Automatically start Firefox in full screen mode',
        ),
        url: '/addon/autofullscreen/',
      },
      {
        title: i18n.gettext('Video Speed Controller'),
        description: i18n.gettext(
          'Adjust video playback speeds with shortcuts',
        ),
        url: '/addon/videospeed/',
      },
      {
        title: i18n.gettext('View Image'),
        description: i18n.gettext(
          'Revive the ‘View Image’ and ‘Search by Image’ buttons on Google Images',
        ),
        url: '/addon/view-image/',
      },
      {
        title: i18n.gettext('Neat URL'),
        description: i18n.gettext('Clean up links for easy sharing'),
        url: '/addon/neat-url/',
      },
      {
        title: i18n.gettext('Glitter Drag'),
        description: i18n.gettext(
          'Drag text, images, or links to perform actions like copy, open, search, and more',
        ),
        url: '/addon/glitterdrag/',
      },
      {
        title: i18n.gettext('Behind The Overlay Revival'),
        description: i18n.gettext('Click a button to close annoying pop-ups'),
        url: '/addon/behind-the-overlay-revival/',
      },
      {
        title: i18n.gettext('Auto-Sort Bookmarks'),
        description: i18n.gettext(
          'Automatically sorts bookmarks so they’re in your preferred position',
        ),
        url: '/addon/auto-sort-bookmarks/',
      },
      {
        title: i18n.gettext('Britannica Insights'),
        description: i18n.gettext(
          'Add Britannica facts to your search results',
        ),
        url: '/addon/britannica-insights/',
      },
    ];

    return heroes.map((hero) => {
      return (
        <HeroSection key={hero.url} linkTo={hero.url}>
          <h3>{hero.title}</h3>
          <p>{hero.description}</p>
        </HeroSection>
      );
    });
  }

  render() {
    return (
      <div className="HomeHeroBanner">
        <Hero name="Home" random sections={this.sections()} />
      </div>
    );
  }
}

const HomeHeroBanner: React.ComponentType<Props> = compose(translate())(
  HomeHeroBannerBase,
);

export default HomeHeroBanner;
