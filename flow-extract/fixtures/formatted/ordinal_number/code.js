import { useLocalization, FluentNumber } from 'fluent-react';

export function Component() {
  const { l10n } = useLocalization();
  const pos = 2;

  return (
    l10n.createMessage(new FluentNumber(pos, {type: 'ordinal'}), {
      1: 'You finished first!',
      one: `You finished ${pos}st`,
      two: `You finished ${pos}nd`,
      few: `You finished ${pos}rd`,
      other: `You finished ${pos}th`,
    })
  );
}
