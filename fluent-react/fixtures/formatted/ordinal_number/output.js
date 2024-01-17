import { useLocalization, FluentNumber } from 'fluent-react';
export function Component() {
  const { l10n } = useLocalization();
  const pos = 2;
  return l10n.getString(
    'message-d92b83fe61',
    {
      'selector-d92b83fe61': new FluentNumber(pos, {
        type: 'ordinal',
      }),
      pos,
    },
    `You finished ${pos}th`,
  );
}
