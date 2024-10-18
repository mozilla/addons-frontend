import { useLocalization } from 'fluent-react';
export function Component() {
  const myObject = useLocalization();
  return <p>{myObject.l10n.getString('message-f63cfcbfd1', {}, 'hello')}</p>;
}
