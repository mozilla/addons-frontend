import { useLocalization } from 'fluent-react';
export function Component() {
  const myObject = useLocalization();
  return <p>{myObject.l10n.createMessage('hello')}</p>;
}
