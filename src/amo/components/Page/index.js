/* @flow */
import makeClassName from 'classnames';
import config from 'config';
import * as React from 'react';
import { withRouter } from 'react-router-dom';

import AppBanner from 'amo/components/AppBanner';
import Header from 'amo/components/Header';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

type Props = {| children: React.Node, isHomePage?: boolean |};

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
  return (
    <>
      <Header isHomePage={isHomePage} location={location} />
      <div className={makeClassName(isHomePage ? 'Page-homepage' : 'Page')}>
        {// Exclude the AppBanner from the home page if it will be
        // included via HeroRecommendation.
        (!isHomePage || !_config.get('enableFeatureHeroRecommendation')) && (
          <AppBanner />
        )}
        {children}
      </div>
    </>
  );
};

const Page: React.ComponentType<Props> = withRouter(PageBase);

export default Page;
