import { useLocalization, FluentDateTime } from 'fluent-react';
export function Component() {
  const { l10n } = useLocalization();
  const lastChecked = new Date();
  return (
    <p>
      {l10n.getString(
        'message-ec24a098b7',
        {
          'expression-dca6558f4f': new FluentDateTime(lastChecked, {
            day: 'numeric',
            month: 'long',
          }),
        },
        `Last checked: ${new FluentDateTime(lastChecked, {
          day: 'numeric',
          month: 'long',
        })}.`,
      )}
    </p>
  );
}
