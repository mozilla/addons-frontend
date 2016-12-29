/* eslint-disable react/no-danger */

import classNames from 'classnames';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Card from 'ui/components/Card';

import './ShowMoreCard.scss';


const MAX_HEIGHT = 100;

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
    this.state = { expanded: true };
  }

  componentDidMount() {
    this.truncateToMaxHeight(ReactDOM.findDOMNode(this.contents));
  }

  onClick = (event) => {
    event.preventDefault();
    this.expandText();
  }

  expandText() {
    this.setState({ expanded: true });
  }

  truncateToMaxHeight = (contents) => {
    // If the contents are short enough they don't need a "show more" link; the
    // contents are expanded by default.
    if (contents.clientHeight > MAX_HEIGHT) {
      this.setState({ expanded: false });
    }
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
          onClick={this.onClick} dangerouslySetInnerHTML={sanitizeHTML(
            i18n.gettext(
              // l10n: The "Expand to" text is for screenreaders so the link
              // makes sense out of context. The HTML makes it hidden from
              // non-screenreaders and must stay.
              '<span class="visually-hidden">Expand to </span> Read more'
            ), ['span']
          )} />
      </Card>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(ShowMoreCardBase);
