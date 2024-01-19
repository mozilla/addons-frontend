import { useLocalization, FluentDateTime } from 'fluent-react';
export function Component() {
  const { l10n } = useLocalization();
  const lastChecked = new Date();
  return (
    <p>
      {l10n.createMessage(
        `Last checked: ${new FluentDateTime(lastChecked, {
          day: 'numeric',
          month: 'long',
        })}.`,
      )}
    </p>
  );
}
