import { useLocalization } from 'fluent-react';
function Component() {
  const { l10n } = useLocalization();
  const name = 'firefox';
  return l10n.createMessage(`browser: ${name}`, {
    descrption: 'Name of the browser',
  });
}
