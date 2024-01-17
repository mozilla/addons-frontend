import { useLocalization } from 'fluent-react';
export function Component() {
  const { l10n } = useLocalization();
  return <p>{l10n.createMessage(`hello`)}</p>;
}
