import { useLocalization } from 'fluent-react';
export function Component() {
  const { l10n } = useLocalization();
  const userGender = 'masculine';
  const brandName = 'Firefox';
  return l10n.createMessage(
    userGender,
    {
      masculine: `${brandName} został zaktualizowany.`,
      feminine: `${brandName} została zaktualizowana.`,
      other: `Program ${brandName} został zaktualizowany.`,
    },
    'feminine',
  );
}
