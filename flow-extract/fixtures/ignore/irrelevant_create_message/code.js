import { useLocalization } from 'fluent-react';

function createMessage() {
  return 'hello';
}

export function Component() {
  const { l10n } = useLocalization();

  return (
    <p>
      {l10n.getString('static')}
      {createMessage()}
    </p>
  );
}
