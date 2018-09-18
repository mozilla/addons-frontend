/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import makeClassName from 'classnames';

import translate from 'core/i18n/translate';
import Hero from 'ui/components/Hero';
import HeroSection from 'ui/components/HeroSection';
import type { I18nType } from 'core/types/i18n';
import tracking from 'core/tracking';
import { withExperiment } from 'core/withExperiment';
import type { WithExperimentInjectedProps } from 'core/withExperiment';

import './styles.scss';

type InternalProps = {|
  ...WithExperimentInjectedProps,
  _tracking: typeof tracking,
  i18n: I18nType,
|};

export const AB_HOME_HERO_EXPERIMENT = 'home_hero';
export const AB_HOME_HERO_VARIANT_A = 'small';
export const AB_HOME_HERO_VARIANT_B = 'large';
export const AB_HOME_HERO_EXPERIMENT_CATEGORY = 'AMO Home Hero Experiment';

export class HomeHeroBannerBase extends React.Component<InternalProps> {
  static defaultProps = {
    _tracking: tracking,
  };

  componentDidMount() {
    const { _tracking, experimentEnabled, variant } = this.props;

    if (!experimentEnabled) {
      return;
    }

    _tracking.sendEvent({
      action: variant,
      category: `${AB_HOME_HERO_EXPERIMENT_CATEGORY} / Page View`,
    });
  }

  getHeroes() {
    const { i18n } = this.props;

    return [
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
        title: i18n.gettext('Iridium for YouTube'),
        description: i18n.gettext(
          'Play videos in a pop-out window, take video screenshots & more',
        ),
        url: '/addon/particle-iridium/',
      },
      {
        title: i18n.gettext('Private Bookmarks'),
        description: i18n.gettext('Password-protect your personal bookmarks'),
        url: '/addon/webext-private-bookmarks/',
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
        title: i18n.gettext('Universal Bypass'),
        description: i18n.gettext(
          'Automatically skip annoying link shorteners',
        ),
        url: '/addon/universal-bypass/',
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
        title: i18n.gettext('Search Preview'),
        description: i18n.gettext(
          'Enjoy thumbnail images alongside your search returns',
        ),
        url: '/addon/searchpreview/',
      },
      {
        title: i18n.gettext('Copy PlainText'),
        description: i18n.gettext(
          'Remove formatting when saving text to your clipboard',
        ),
        url: '/addon/copy-plaintext/',
      },
    ];
  }

  sections() {
    return this.getHeroes().map((hero) => {
      const { description, title, url } = hero;

      return (
        <HeroSection
          key={url}
          linkTo={url}
          onClick={(e) => this.trackExperimentClick(e, title)}
        >
          <h3>{title}</h3>
          <p>{description}</p>
        </HeroSection>
      );
    });
  }

  trackExperimentClick = (e: SyntheticEvent<HTMLElement>, title: string) => {
    const { _tracking, experimentEnabled, variant } = this.props;

    if (!experimentEnabled) {
      return;
    }

    _tracking.sendEvent({
      action: variant,
      category: `${AB_HOME_HERO_EXPERIMENT_CATEGORY} / Click`,
      label: title,
    });
  };

  render() {
    const homeBannerClass = makeClassName('HomeHeroBanner', {
      'HomeHeroBanner--small': this.props.variant === AB_HOME_HERO_VARIANT_A,
    });

    return (
      <div className={homeBannerClass}>
        <Hero name="Home" random sections={this.sections()} />
      </div>
    );
  }
}

const HomeHeroBanner: React.ComponentType<InternalProps> = compose(
  translate(),
  withExperiment({
    id: AB_HOME_HERO_EXPERIMENT,
    variantA: AB_HOME_HERO_VARIANT_A,
    variantB: AB_HOME_HERO_VARIANT_B,
  }),
)(HomeHeroBannerBase);

export default HomeHeroBanner;
