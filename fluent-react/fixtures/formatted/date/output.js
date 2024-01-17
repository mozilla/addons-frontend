import { useLocalization, FluentDateTime } from 'fluent-react';
export function Component() {
  const { l10n } = useLocalization();
  const lastChecked = new Date();
  return (
    <p>
      {l10n.getString(
        'message-355300453f',
        {
          'expression-6c4373be7e': new FluentDateTime(lastChecked, {
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
