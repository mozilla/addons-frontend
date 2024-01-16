import { useLocalization } from 'fluent-react';
export function Component() {
  const { l10n } = useLocalization();
  return <p>{l10n.getString('message-3cc2fbf074', {}, `hello`)}</p>;
}
