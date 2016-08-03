import React, { PropTypes } from 'react';

import translate from 'core/i18n/translate';

import AddonMeta from 'amo/components/AddonMeta';
import InstallButton from 'disco/components/InstallButton';
import LikeButton from 'amo/components/LikeButton';
import ScreenShots from 'amo/components/ScreenShots';
import SearchBox from 'amo/components/SearchBox';


import 'amo/css/AddonDetail.scss';

export class AddonDetail extends React.Component {
  static propTypes = {
    i18n: PropTypes.object,
  }

  render() {
    const { i18n } = this.props;

    return (
      <div className="AddonDetail">
        <header>
          <SearchBox />
          <div className="icon">
            <img alt="" />
            <LikeButton />
          </div>
          <div className="title">
            <h1>Placeholder Add-on Title
              <span className="author">by <a href="#">AwesomeAddons</a></span></h1>
            <InstallButton slug="placeholder" />
          </div>
          <div className="description">
            <p>Lorem ipsum dolor sit amet, dicat graece partiendo cu usu.
            Vis recusabo accusamus et.</p>
          </div>
        </header>

        <section className="addon-metadata">
          <h2 className="visually-hidden">{i18n.gettext('Extension Metadata')}</h2>
          <AddonMeta />
        </section>

        <hr />

        <section className="screenshots">
          <h2>{i18n.gettext('Screenshots')}</h2>
          <ScreenShots />
        </section>

        <hr />

        <section className="about">
          <h2>{i18n.gettext('About this extension')}</h2>
          <p>Lorem ipsum dolor sit amet, dicat graece partiendo cu usu. Vis
          recusabo accusamus et, vitae scriptorem in vel. Sed ei eleifend
          molestiae deseruisse, sit mucius noster mentitum ex. Eu pro illum
          iusto nemore, te legere antiopam sit. Suas simul ad usu, ex putent
          timeam fierent eum. Dicam equidem cum cu. Vel ea vidit timeam.</p>

          <p>Eu nam dicant oportere, et per habeo euismod denique, te appetere
          temporibus mea. Ad solum reprehendunt vis, sea eros accusata senserit
          an, eam utinam theophrastus in. Debet consul vis ex. Mei an iusto
          delicatissimi, ut timeam electram maiestatis nam, te petentium
          intellegebat ius. Ei legere everti.</p>
        </section>
      </div>
    );
  }
}

export default translate({ withRef: true })(AddonDetail);
