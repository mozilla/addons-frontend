import config from 'config';
import { getLanguage } from 'core/i18n/utils';

const defaultLang = config.get('defaultLang');


const setLanguage = (req, res, next) => {
  let lang = defaultLang;
  // Locale can be changed by passing ?lang=<lang> in the querystring
  const langQS = req.query ? req.query.lang : null;
  if (langQS) {
    lang = getLanguage(langQS);
  }
  // eslint-disable-next-line no-param-reassign
  res.locals.lang = lang;
  next();
};

export default setLanguage;
