import { useLocalization } from 'fluent-react';
function Component() {
  const { l10n } = useLocalization();
  return l10n.getString(
    'message-53b97860bd',
    {
      'expression-05e7fe749e': 1 + 1,
    },
    `${1 + 1} is not a reference`,
  );
}
