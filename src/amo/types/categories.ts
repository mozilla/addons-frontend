export type CategoryType = {
  application: string;
  description: string | null;
  id: number;
  misc: boolean;
  name: string;
  slug: string;
  type: 'extension' | 'dictionary' | 'search' | 'language' | 'statictheme';
  weight: number;
};