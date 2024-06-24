import { fakeI18n } from 'tests/unit/helpers';
import {
  getIllegalCategoryOptions,
  getIllegalSubcategoryOptions,
} from 'amo/components/FeedbackForm';

describe(__filename, () => {
  describe('getIllegalCategoryOptions', () => {
    // See: https://mozilla.github.io/addons-server/topics/api/abuse.html#abuse-report-illegal-category-parameter
    it('returns a list of illegal categories', () => {
      const categories = getIllegalCategoryOptions(fakeI18n());

      expect(categories.map((category) => category.value)).toEqual([
        '',
        'animal_welfare',
        'consumer_information',
        'data_protection_and_privacy_violations',
        'illegal_or_harmful_speech',
        'intellectual_property_infringements',
        'negative_effects_on_civic_discourse_or_elections',
        'non_consensual_behaviour',
        'pornography_or_sexualized_content',
        'protection_of_minors',
        'risk_for_public_security',
        'scams_and_fraud',
        'self_harm',
        'unsafe_and_prohibited_products',
        'violence',
        'other',
      ]);
    });
  });

  describe('getIllegalSubcategoryOptions', () => {
    // See: https://mozilla.github.io/addons-server/topics/api/abuse.html#abuse-report-illegal-subcategory-parameter
    it.each([
      ['animal_welfare', ['', 'other']],
      [
        'consumer_information',
        [
          '',
          'insufficient_information_on_traders',
          'noncompliance_pricing',
          'hidden_advertisement',
          'misleading_info_goods_services',
          'misleading_info_consumer_rights',
          'other',
        ],
      ],
      [
        'data_protection_and_privacy_violations',
        [
          '',
          'biometric_data_breach',
          'missing_processing_ground',
          'right_to_be_forgotten',
          'data_falsification',
          'other',
        ],
      ],
      [
        'illegal_or_harmful_speech',
        ['', 'defamation', 'discrimination', 'hate_speech', 'other'],
      ],
      [
        'intellectual_property_infringements',
        [
          '',
          'design_infringement',
          'geographic_indications_infringement',
          'patent_infringement',
          'trade_secret_infringement',
          'other',
        ],
      ],
      [
        'negative_effects_on_civic_discourse_or_elections',
        [
          '',
          'violation_eu_law',
          'violation_national_law',
          'misinformation_disinformation_disinformation',
          'other',
        ],
      ],
      [
        'non_consensual_behaviour',
        [
          '',
          'non_consensual_image_sharing',
          'non_consensual_items_deepfake',
          'online_bullying_intimidation',
          'stalking',
          'other',
        ],
      ],
      [
        'pornography_or_sexualized_content',
        ['', 'adult_sexual_material', 'image_based_sexual_abuse', 'other'],
      ],
      [
        'protection_of_minors',
        [
          '',
          'age_specific_restrictions_minors',
          'child_sexual_abuse_material',
          'grooming_sexual_enticement_minors',
          'other',
        ],
      ],
      [
        'risk_for_public_security',
        [
          '',
          'illegal_organizations',
          'risk_environmental_damage',
          'risk_public_health',
          'terrorist_content',
          'other',
        ],
      ],
      [
        'scams_and_fraud',
        [
          '',
          'inauthentic_accounts',
          'inauthentic_listings',
          'inauthentic_user_reviews',
          'impersonation_account_hijacking',
          'phishing',
          'pyramid_schemes',
          'other',
        ],
      ],
      [
        'self_harm',
        [
          '',
          'content_promoting_eating_disorders',
          'self_mutilation',
          'suicide',
          'other',
        ],
      ],
      [
        'unsafe_and_prohibited_products',
        ['', 'prohibited_products', 'unsafe_products', 'other'],
      ],
      [
        'violence',
        [
          '',
          'coordinated_harm',
          'gender_based_violence',
          'human_exploitation',
          'human_trafficking',
          'incitement_violence_hatred',
          'other',
        ],
      ],
      ['other', ['', 'other']],
    ])('returns a list of sub-category for %s', (category, expected) => {
      const subcategories = getIllegalSubcategoryOptions(fakeI18n(), category);

      expect(subcategories.map((subcategory) => subcategory.value)).toEqual(
        expected,
      );
    });
  });
});
