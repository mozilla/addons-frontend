import { useLocalization } from 'fluent-react';
function Component() {
  const { l10n } = useLocalization();
  const name = 'firefox';
  return l10n.getString(
    'message-a2b13d8a3d',
    {
      name,
    },
    `browser: ${name}`,
  );
}
