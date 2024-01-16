import { useLocalization } from 'fluent-react';

function Component() {
  const { l10n } = useLocalization();
  return l10n.createMessage(`${1 + 1} is not a reference`);
}
