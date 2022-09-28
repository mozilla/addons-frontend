/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { compose } from 'redux';

import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import Page from 'amo/components/Page';
import { useFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import {
  fetchAddon,
  fetchAddonInfo,
  getAddonByIdInURL,
  getAddonInfoBySlug,
  isAddonInfoLoading,
  isAddonLoading,
} from 'amo/reducers/addons';
import {
  fetchVersion,
  getLoadingBySlug,
  getVersionById,
} from 'amo/reducers/versions';
import { sanitizeUserHTML } from 'amo/utils';
import Card from 'amo/components/Card';
import LoadingText from 'amo/components/LoadingText';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export const ADDON_INFO_TYPE_CUSTOM_LICENSE: 'license' = 'license';
export const ADDON_INFO_TYPE_EULA: 'eula' = 'eula';
export const ADDON_INFO_TYPE_PRIVACY_POLICY: 'privacy' = 'privacy';

export type AddonInfoTypeType =
  | typeof ADDON_INFO_TYPE_CUSTOM_LICENSE
  | typeof ADDON_INFO_TYPE_EULA
  | typeof ADDON_INFO_TYPE_PRIVACY_POLICY;

type Props = {|
  infoType: AddonInfoTypeType,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const AddonInfoBase = ({
  i18n,
  infoType,
}: InternalProps): React.Node => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const errorHandler = useFixedErrorHandler({
    fileName: __filename,
    id: `${slug}-${infoType}`,
  });

  const addon = useSelector((state) => getAddonByIdInURL(state.addons, slug));
  const addonVersion = useSelector((state) => {
    if (addon && addon.currentVersionId) {
      return getVersionById({
        id: addon.currentVersionId,
        state: state.versions,
      });
    }
    return null;
  });
  const addonIsLoading = useSelector((state) => isAddonLoading(state, slug));
  const addonInfo = useSelector((state) =>
    getAddonInfoBySlug({ slug, state: state.addons }),
  );
  const addonInfoIsLoading = useSelector((state) =>
    isAddonInfoLoading({ slug, state: state.addons }),
  );
  const addonVersionIsLoading = useSelector((state) =>
    getLoadingBySlug({ slug, state: state.versions }),
  );

  React.useEffect(() => {
    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error');
      return;
    }

    // If the slug changes, then `addon` should get updated to undefined
    // because of the `useSelector` above, so we can just check for !addon.
    if (!addon && !addonIsLoading) {
      dispatch(fetchAddon({ showGroupedRatings: true, slug, errorHandler }));
    }

    if (infoType === ADDON_INFO_TYPE_CUSTOM_LICENSE) {
      const needsLicenceText =
        addonVersion &&
        addonVersion.license &&
        addonVersion.license.text === undefined;
      if (
        addon &&
        addon.currentVersionId &&
        !addonVersionIsLoading &&
        (!addonVersion || needsLicenceText)
      ) {
        dispatch(
          fetchVersion({
            errorHandlerId: errorHandler.id,
            slug,
            versionId: addon.currentVersionId,
          }),
        );
      }
    } else if ((!addonInfo || !addon) && !addonInfoIsLoading) {
      dispatch(fetchAddonInfo({ slug, errorHandlerId: errorHandler.id }));
    }
  }, [slug]);

  let header = '';
  let infoContent;
  let infoHtml;
  let title;

  switch (infoType) {
    case ADDON_INFO_TYPE_CUSTOM_LICENSE:
      title = i18n.gettext('Custom License for %(addonName)s');
      if (addonVersion && addonVersion.license) {
        // If license.text is null, as opposed to undefined, it means we have
        // already retrieved the licence, but that it's null on the server.
        if (addonVersion.license.text === null) {
          infoContent = '';
        } else infoContent = addonVersion.license.text;
      } else {
        infoContent = null;
      }
      break;
    case ADDON_INFO_TYPE_EULA:
      title = i18n.gettext('End-User License Agreement for %(addonName)s');
      infoContent = addonInfo ? addonInfo.eula : null;
      break;
    case ADDON_INFO_TYPE_PRIVACY_POLICY:
      title = i18n.gettext('Privacy policy for %(addonName)s');
      infoContent = addonInfo ? addonInfo.privacyPolicy : null;
      break;
    default:
      title = '';
  }

  if (addon) {
    header = i18n.sprintf(title, { addonName: addon.name });
  }

  if (
    infoContent ||
    (infoType === ADDON_INFO_TYPE_CUSTOM_LICENSE && infoContent)
  ) {
    infoHtml = sanitizeUserHTML(infoContent);
  }

  return (
    <Page errorHandler={errorHandler}>
      <div className={makeClassName('AddonInfo', `AddonInfo--${infoType}`)}>
        {addon && (
          <Helmet>
            <title>{header}</title>
            <meta name="robots" content="noindex, follow" />
          </Helmet>
        )}

        {errorHandler.renderErrorIfPresent()}

        <AddonSummaryCard addon={addon} headerText={header} />

        <Card className="AddonInfo-info" header={header}>
          {infoHtml ? (
            <p
              className="AddonInfo-info-html"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={infoHtml}
            />
          ) : (
            <LoadingText />
          )}
        </Card>
      </div>
    </Page>
  );
};

const AddonInfo: React.ComponentType<Props> = compose(translate())(
  AddonInfoBase,
);

export default AddonInfo;
