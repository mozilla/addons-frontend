/* @flow */
import makeClassName from 'classnames';
import config from 'config';
import * as React from 'react';
import { withRouter } from 'react-router-dom';

import AppBanner from 'amo/components/AppBanner';
import Footer from 'amo/components/Footer';
import Header from 'amo/components/Header';
import InfoDialog from 'core/components/InfoDialog';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

type Props = {|
  children: React.Node,
  isHomePage?: boolean,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  location: ReactRouterLocationType,
|};

export const PageBase = ({
  _config = config,
  children,
  isHomePage = false,
  location,
}: InternalProps) => {
  const enableFeatureHeroRecommendation = _config.get(
    'enableFeatureHeroRecommendation',
  );

  return (
    <div className="Page-amo">
      <InfoDialog />

      <Header isHomePage={isHomePage} location={location} />

      <div className="Page-content">
        <div
          className={makeClassName('Page', {
            'Page-not-homepage': !isHomePage,
            'Page-no-hero-promo': !enableFeatureHeroRecommendation,
          })}
        >
          {// Exclude the AppBanner from the home page if it will be
          // included via HeroRecommendation.
          (!isHomePage || !enableFeatureHeroRecommendation) && <AppBanner />}
          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
};

const Page: React.ComponentType<Props> = withRouter(PageBase);

export default Page;
