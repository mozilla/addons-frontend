import { useLocalization } from 'fluent-react';
export function Component() {
  const { l10n } = useLocalization();
  const userGender = 'masculine';
  const brandName = 'Firefox';
  return l10n.getString(
    'message-295bd5fb39',
    {
      userGender,
      brandName,
    },
    `Program ${brandName} został zaktualizowany.`,
  );
}
