import { useLocalization } from 'fluent-react';
function Component() {
  const { l10n } = useLocalization();
  const name = 'firefox';
  const adjective = 'cool';
  return l10n.getString(
    'message-df1a7a0e57',
    {
      name,
      adjective,
    },
    `${name} is ${adjective}`,
  );
}
