import makeClassName from 'classnames';
import PropTypes from 'prop-types';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';

import './styles.scss';

export class ExpandableCardBase extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    header: PropTypes.node,
    i18n: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { expanded: false };
  }

  onClick = (event) => {
    event.preventDefault();

    this.setState({ expanded: !this.state.expanded });
  };

  render() {
    const { children, className, header, i18n } = this.props;
    const { expanded } = this.state;

    const headerWithExpandLink = (
      <a
        aria-checked={expanded}
        className="ExpandableCard-ToggleLink"
        href="#toggle-content"
        onClick={this.onClick}
        role="switch"
        title={i18n.gettext('Toggle contents')}
      >
        {header}
        <Icon
          className="ExpandableCard-ToggleArrow"
          name="triangle-down-black"
        />
      </a>
    );

    return (
      <Card
        className={makeClassName('ExpandableCard', className, {
          'ExpandableCard--expanded': expanded,
        })}
        header={headerWithExpandLink}
      >
        <div className="ExpandableCard-contents">{children}</div>
      </Card>
    );
  }
}

export default compose(translate())(ExpandableCardBase);
