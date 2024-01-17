import { useLocalization } from 'fluent-react';
function Component() {
  const { l10n } = useLocalization();
  const name = 'firefox';
  const adjective = 'cool';
  return l10n.createMessage(`${name} is ${adjective}`);
}
