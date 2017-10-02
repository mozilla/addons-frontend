import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import AddonsCard from 'amo/components/AddonsCard';

export default class LandingAddonsCard extends React.Component {
  static propTypes = {
    addons: PropTypes.array.isRequired,
    className: PropTypes.string,
    footerLink: PropTypes.node.isRequired,
    header: PropTypes.node.isRequired,
    loading: PropTypes.bool.isRequired,
  }

  render() {
    const {
      addons, className, footerLink, header, loading,
    } = this.props;

    return (
      <AddonsCard
        addons={addons}
        className={classNames('LandingAddonsCard', className)}
        footerLink={footerLink}
        header={header}
        type="horizontal"
        loading={loading}
      />
    );
  }
}
