import classNames from 'classnames';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';

import './ShowMoreCard.scss';


export class ShowMoreCardBase extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    header: PropTypes.node,
    footer: PropTypes.node,
    i18n: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = { expanded: false };
  }

  componentDidMount() {
    this.expandIfDescriptionIsShortEnough();
  }

  expandIfDescriptionIsShortEnough = () => {
    // If the add-on description is short enough it doesn't need a "show more"
    // link, we'll expand the description by default.
    if (ReactDOM.findDOMNode(this.contents).clientHeight < 100) {
      this.setState({ expanded: true });
    }
  }

  expandText = (event) => {
    event.preventDefault();
    this.setState({ expanded: true });
  }

  render() {
    const { children, className, header, footer, i18n } = this.props;
    const { expanded } = this.state;

    return (
      <Card className={classNames('ShowMoreCard', className, {
        'ShowMoreCard--expanded': expanded,
      })} header={header} footer={footer}>
        <div className="ShowMoreCard-contents"
          ref={(ref) => { this.contents = ref; }}>
          {children}
        </div>
        <a className="ShowMoreCard-revealMoreLink" href="#show-more"
          onClick={this.expandText}>
          {i18n.gettext('Show more info…')}
        </a>
      </Card>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(ShowMoreCardBase);
