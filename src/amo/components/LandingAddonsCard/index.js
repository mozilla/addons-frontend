import classNames from 'classnames';
import React, { PropTypes } from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';

import './LandingAddonsCard.scss';


export default class LandingAddonsCard extends React.Component {
  static propTypes = {
    addons: PropTypes.array.isRequired,
    className: PropTypes.string,
    footerLink: PropTypes.object.isRequired,
    footerText: PropTypes.string.isRequired,
    header: PropTypes.node.isRequired,
  }

  render() {
    const { addons, className, footerLink, footerText, header } = this.props;
    const footer = (
      <Link className="LandingAddonsCard-more-link" to={footerLink}>
        {footerText}
      </Link>
    );

    return (
      <AddonsCard className={classNames('LandingAddonsCard', className)}
        addons={addons} footer={footer} header={header} />
    );
  }
}
