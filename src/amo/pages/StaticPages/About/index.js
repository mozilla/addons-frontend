/* @flow */
import * as React from 'react';

import StaticPage from 'amo/components/StaticPage';
import translate from 'amo/i18n/translate';
import { sanitizeHTML } from 'amo/utils';
import type { I18nType } from 'amo/types/i18n';

type Props = {|
  i18n: I18nType,
|};

export class AboutBase extends React.Component<Props> {
  render(): React.Node {
    const { i18n } = this.props;

    return (
      <StaticPage
        title={i18n.gettext('About Firefox Add-ons')}
        metaDescription={i18n.gettext(`The official Mozilla site for downloading
          Firefox extensions and themes. Add new features and change the
          browser’s appearance to customize your web experience.`)}
      >
        <>
          <div id="about">
            <p>
              {i18n.gettext(`Addons.mozilla.org (AMO), is Mozilla's official site
                for discovering and installing add-ons for the Firefox browser.
                Add-ons help you modify and personalize your browsing experience
                by adding new features to Firefox, enhancing your interactions
                with Web content, and changing the way your browser looks.`)}
            </p>
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(`If you are looking for add-ons for Thunderbird or SeaMonkey, please visit
                  %(startTBLink)saddons.thunderbird.net%(endTBLink)s or
                  %(startSMLink)saddons.thunderbird.net/seamonkey%(endSMLink)s.`),
                  {
                    startTBLink:
                      '<a href="https://addons.thunderbird.net/thunderbird/">',
                    endTBLink: '</a>',
                    startSMLink:
                      '<a href="https://addons.thunderbird.net/seamonkey/">',
                    endSMLink: '</a>',
                  },
                ),
                ['a'],
              )}
            />
          </div>
          <section>
            <h2>{i18n.gettext('A community of creators')}</h2>
            <p>
              {i18n.gettext(`The add-ons listed here are created by
                thousands of developers and theme designers from all over the
                world, ranging from individual hobbyists to large corporations.
                Some add-ons listed on AMO have been automatically published
                and may be subject to review by a team of editors once
                publicly listed.`)}
            </p>
          </section>
          <section>
            <h2>{i18n.gettext(`Get involved`)}</h2>
            <p>
              {i18n.gettext(`Mozilla is a non-profit champion of the Internet, we
                build Firefox to help keep it healthy, open and accessible. Add-ons
                support user choice and customization in Firefox, and you can
                contribute in the following ways:`)}
            </p>
            <ul>
              <li
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={sanitizeHTML(
                  i18n.sprintf(
                    i18n.gettext(`%(startLink)sMake your own add-on%(endLink)s.
                        We provide free hosting and update services and can help you
                        reach a large audience of users.`),
                    {
                      startLink:
                        '<a href="https://addons.mozilla.org/developers/">',
                      endLink: '</a>',
                    },
                  ),
                  ['a'],
                )}
              />
              <li
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={sanitizeHTML(
                  i18n.sprintf(
                    i18n.gettext(`Help improve this website. It's open source, and you
                        can file bugs and submit patches. You can get started with a
                        %(startGoodFirstBugLink)sgood first bug%(endGoodFirstBugLink)s
                        or view all open issues for AMO’s
                        %(startAddonsServerRepoLink)sserver%(endAddonsServerRepoLink)s and
                        %(startAddonsFrontendRepoLink)sfrontend%(endAddonsFrontendRepoLink)s
                        on Github.`),
                    {
                      startGoodFirstBugLink:
                        '<a href="https://github.com/search?l=&q=repo:mozilla/addons+repo:mozilla/addons-frontend+repo:mozilla/addons-linter+repo:mozilla/addons-server+label:%22contrib:+good+first+bug%22&ref=advsearch&state=open&type=Issues">',
                      endGoodFirstBugLink: '</a>',
                      startAddonsServerRepoLink:
                        '<a href="https://github.com/mozilla/addons-server/issues">',
                      endAddonsServerRepoLink: '</a>',
                      startAddonsFrontendRepoLink:
                        '<a href="https://github.com/mozilla/addons-frontend/issues">',
                      endAddonsFrontendRepoLink: '</a>',
                    },
                  ),
                  ['a'],
                )}
              />
              <li
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={sanitizeHTML(
                  i18n.sprintf(
                    i18n.gettext(`Want to interact with addons.mozilla.org
                      (AMO) programmatically? Check out the
                      %(startAddonsServerDocumentation)sAdd-ons Servers
                      documentation%(endAddonsServerDocumentation)s for details
                      about the APIs used by AMO and the
                      %(startAddonsManager)sAdd-ons
                      Manager%(endAddonsManager)s.`),
                    {
                      startAddonsServerDocumentation:
                        '<a href="https://addons-server.readthedocs.io/en/latest/index.html">',
                      endAddonsServerDocumentation: '</a>',
                      startAddonsManager:
                        '<a href="https://blog.mozilla.org/firefox/add-ons-manager/">',
                      endAddonsManager: '</a>',
                    },
                  ),
                  ['a'],
                )}
              />
            </ul>
            <p>
              {i18n.gettext(
                `If you want to contribute but are not quite as technical, there are still ways to help:`,
              )}
            </p>
            <ul>
              <li
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={sanitizeHTML(
                  i18n.sprintf(
                    i18n.gettext(
                      `Participate in our %(startLink)sforum%(endLink)s.`,
                    ),
                    {
                      startLink:
                        '<a href="https://discourse.mozilla-community.org/c/add-ons">',
                      endLink: '</a>',
                    },
                  ),
                  ['a'],
                )}
              />
              <li>
                {i18n.gettext(`Leave feedback for your favorite add-ons. Add-on authors are more likely
                  to improve their add-ons and create new ones when they know people appreciate their
                  work.`)}
              </li>
              <li>
                {i18n.gettext(`Tell your friends and family that Firefox is a fast, secure browser
                  that protects their privacy, and they can use add-ons to make it their own!`)}
              </li>
            </ul>
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(
                    `To see more ways you can contribute to the add-on community, please visit our %(startLink)swiki%(endLink)s.`,
                  ),
                  {
                    startLink:
                      '<a href="https://wiki.mozilla.org/Add-ons/Contribute">',
                    endLink: '</a>',
                  },
                ),
                ['a'],
              )}
            />
          </section>
          <section>
            <h2 id="reportIssue">{i18n.gettext('Report an issue')}</h2>
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(`If you find a problem with the site, we'd love to fix it.
                   Please file an %(startIssueLink)sissue%(endIssueLink)s and include as much
                    detail as possible.`),
                  {
                    startIssueLink:
                      '<a href="https://github.com/mozilla/addons/issues/new">',
                    endIssueLink: '</a>',
                  },
                ),
                ['a'],
              )}
            />
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(
                    `To report a security vulnerability for an extension, even if it is not
                     hosted on this site, please file an %(startSecIssueLink)sissue%(endSecIssueLink)s
                      on Bugzilla.
                      All security vulnerability reports are %(startLink)sconfidential%(endLink)s.`,
                  ),
                  {
                    startSecIssueLink:
                      '<a href="https://bugzilla.mozilla.org/enter_bug.cgi?product=addons.mozilla.org&component=Add-on%20Security&maketemplate=Add-on%20Security%20Bug&bit-23=1&rep_platform=All&op_sys=All" rel="nofollow">',
                    endSecIssueLink: '</a>',
                    startLink:
                      '<a href="https://www.mozilla.org/en-US/about/governance/policies/security-group/bugs/" rel="nofollow">',
                    endLink: '</a>',
                  },
                ),
                ['a'],
              )}
            />
          </section>
          <section>
            <h2>{i18n.gettext('Get support')}</h2>
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(`If you would like to learn more about how to manage add-ons in
                      Firefox, or need to find general Firefox support, please visit
                      %(startSUMOLink)sSupport%(endSUMOLink)s
                      Mozilla. If you don't find an answer there, you can
                      %(startForumLink)sask on our community forum%(endForumLink)s.`),
                  {
                    startSUMOLink:
                      '<a href="https://support.mozilla.org/products/firefox/manage-preferences-and-add-ons-firefox/install-and-manage-add-ons">',
                    endSUMOLink: '</a>',
                    startForumLink:
                      '<a href="https://discourse.mozilla-community.org/c/add-ons">',
                    endForumLink: '</a>',
                  },
                ),
                ['a'],
              )}
            />
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(
                    `%(startLink)sInformation about how to contact Mozilla's add-ons team can be found here%(endLink)s.`,
                  ),
                  {
                    startLink:
                      '<a href="https://wiki.mozilla.org/Add-ons#Getting_in_touch">',
                    endLink: '</a>',
                  },
                ),
                ['a'],
              )}
            />
          </section>
        </>
      </StaticPage>
    );
  }
}

export default (translate()(AboutBase): React.ComponentType<Props>);
