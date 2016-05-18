import config from 'config';

const amoCDN = config.get('amoCDN');
const amoHost = config.get('apiHost');

export default {
  results: [{
    editorial_description: 'Hover over the image to preview',
    heading: 'Japanese Tattoo by MaDonna',
    id: '18781',
    name: 'Japanese Tattoo',
    slug: 'japanese-tattoo',
    sub_heading: null,
    type: 'Theme',
    url: `${amoHost}/en-US/firefox/addon/japanese-tattoo/`,
    themeURL: `${amoCDN}/user-media/addons/18781/preview_large.jpg?1239806327`,
    headerURL: `${amoCDN}/user-media/addons/18781/personare.jpg?1239806327`,
    footerURL: `${amoCDN}/user-media/addons/18781/persona2re.jpg?1239806327`,
    textcolor: '#000000',
    accentcolor: '#ffffff',
  }, {
    editorial_description: '<em>&ldquo;This add-on is amazing.&rdquo;</em> — Someone',
    heading: 'Something something',
    sub_heading: 'with NoScript',
    id: 722,
    imageURL: `${amoCDN}/user-media/addon_icons/0/722-64.png?modified=1388632826`,
    name: 'NoScript Security Suite',
    slug: 'noscript',
    type: 'Extension',
    url: `${amoHost}/en-US/firefox/addon/noscript/`,
  }],
};
