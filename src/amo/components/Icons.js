import React from 'react';

import FoxPuzzle from 'amo/img/icons/FoxPuzzle.svg';
import LoginPerson from 'amo/img/icons/LoginPerson.svg';

import './Icons.scss';


export default class Icons extends React.Component {
  render() {
    const iconsHTML = [FoxPuzzle, LoginPerson].join('');

    return (
      <svg className="Icons" xmlns="http://www.w3.org/2000/svg" version="1.1"
        dangerouslySetInnerHTML={{__html: iconsHTML}} />
    );
  }
}
