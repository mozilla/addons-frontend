import config from 'config';

const amoCDN = config.get('amoCDN');
const amoHost = config.get('apiHost');

export default {
  addons: {
    'japanese-tattoo': {
      editorial_description: 'Hover over the image to preview',
      heading: 'Japanese Tattoo by MaDonna',
      id: '18781',
      guid: '18781@personas.mozilla.org',
      name: 'Japanese Tattoo',
      slug: 'japanese-tattoo',
      sub_heading: null,
      type: 'theme',
      url: `${amoHost}/en-US/firefox/addon/japanese-tattoo/`,
      installURL: 'https://addons.mozilla.org/en-US/firefox/addon/10900/',
      themeURL: `${amoCDN}/user-media/addons/18781/preview_large.jpg?1239806327`,
      headerURL: `${amoCDN}/user-media/addons/18781/personare.jpg?1239806327`,
      footerURL: `${amoCDN}/user-media/addons/18781/persona2re.jpg?1239806327`,
      textcolor: '#000000',
      accentcolor: '#ffffff',
    },
    'awesome-screenshot-capture-': {
      editorial_description: '<em>&ldquo;The best. Very easy to use.&rdquo;</em> — meetdak',
      heading: 'Take screenshots',
      sub_heading: 'with Awesome Screenshot Plus',
      id: 727,
      guid: 'jid0-GXjLLfbCoAx0LcltEdFrEkQdQPI@jetpack',
      imageURL: `${amoCDN}/user-media/addon_icons/287/287841-64.png?modified=1353989650`,
      installURL: 'https://addons.mozilla.org/firefox/downloads/latest/287841/' +
        'addon-287841-latest.xpi?src=dp-btn-primary',
      name: 'Awesome Screenshot Plus - Capture, Annotate & More',
      slug: 'awesome-screenshot-capture-',
      type: 'extension',
      url: `${amoHost}/en-US/firefox/addon/awesome-screenshot-capture-/`,
    },
  },
};
