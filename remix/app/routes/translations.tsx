import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Gender } from '~/tranlations';

export default function TranslationsIndex() {
  let { i18n } = useTranslation();
  const [userName, setUserName] = useState('Test');
  const [count, setCount] = useState(1);
  const [gender, setGender] = useState(Gender.Female);

  const tConfig = [
    {
      key: 'hello-user',
      config: {
        userName,
      },
    },
    {
      key: 'photo-count',
      config: {
        count,
      },
      hidden: true,
    },
    {
      key: 'user-gender',
      config: {
        context: gender,
      },
      hidden: true,
    },
    {
      key: 'shared-photos',
      config: {
        userName,
        count,
        context: gender,
      },
    },
  ];

  return (
    <div>
      <h1>Translations</h1>
      {tConfig.filter(({hidden}) => !hidden).map(({key, config}) => (
        <div key={key}>
          <span>{key}</span>
          <span>{i18n.t(key, config)}</span>
        </div>
      ))}
      <div>
        <label htmlFor="username">Username</label>
        <input id="username" type="text" value={userName} onChange={(e) => setUserName(e.target.value)} />
      </div>
      <div>
        <span>shared-photos</span>
        <span>
          {i18n.t('shared-photos', {count, userName, context: gender})}
        </span>
      </div>
      <div>
        <label htmlFor="gender">Gender</label>
        <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
          {Object.entries(Gender).map(([key, value]) => (
            <option key={value} value={value}>
              {key}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="photoCount">Photo Count</label>
        <input id="photoCount" type="range" min={0} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} />
      </div>
    </div>
  )
}
