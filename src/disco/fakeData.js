import config from 'config';

const amoCDN = config.get('amoCDN');
const amoHost = config.get('apiHost');

export default {
  addons: {
    'japanese-tattoo': {
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
    },
    easyscreenshot: {
      editorial_description: '<em>&ldquo;This add-on is amazing.&rdquo;</em> — Someone',
      heading: 'Easy Screenshot',
      sub_heading: 'with Easy Screenshot',
      id: 727,
      guid: 'jid0-SnuIiIyRmNnMhukLu6VK8DQkq12@jetpack',
      imageURL: '${amoCDN}/user-media/addon_icons/600/600376-64.png?modified=1453360816',
      installURL: '${amoHost}/firefox/downloads/latest/600376/addon-600376-latest.xpi?src=search',
      name: 'Easy Screenshot',
      slug: 'easyscreenshot',
      type: 'Extension',
      url: 'https://addons.mozilla.org/en-US/firefox/addon/easy-screenshot',
    },
  },
};
