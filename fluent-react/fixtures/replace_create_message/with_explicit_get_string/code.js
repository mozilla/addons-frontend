import { useLocalization } from 'fluent-react';
export function Component() {
  const { l10n } = useLocalization();
  return (
    <div>
      <p>{l10n.createMessage('hello')}</p>
      <p>{l10n.getString('static-id')}</p>
    </div>
  );
}
