# Hybrid Content Telemetry

Telemetry is being introduced to the discovery pane to replace Google Analytics.

The following events are logged to telemetry if:

- HCT is enabled for the host
- Telemetry collection is allowed by the end-user.

| Category          | Method               | Action                  | Value               | This is logged when...                  |
| ----------------- | -------------------- | ----------------------- | ------------------- | --------------------------------------- |
| disco.interaction | addon_click          | addon/theme/statictheme | [Add-on name]       | An add-on link is clicked               |
| disco.interaction | ext_download_fail    | addon                   | [Add-on name]       | The download of an extension has failed |
| disco.interaction | ext_enable           | addon                   | [Add-on name]       | Extension is enabled                    |
| disco.interaction | ext_installed        | addon                   | [Add-on name]       | Extension is installed                  |
| disco.interaction | ext_install_cancel   | addon                   | [Add-on name]       | Extension install is cancelled          |
| disco.interaction | ext_install_start    | addon                   | [Add-on name]       | Extension install has started           |
| disco.interaction | ext_uninstall        | addon                   | [Add-on name]       | Extension uninstalled                   |
| disco.interaction | navigation_click     | click                   | [Click description] | When user clicks "Find more Add-ons"    |
| disco.interaction | theme_download_fail  | [theme/statictheme]     | [Add-on name]       | Theme download fails                    |
| disco.interaction | theme_enable         | [theme/statictheme]     | [theme name]        | Theme is enabled                        |
| disco.interaction | theme_installed      | [theme/statictheme]     | [theme name]        | Theme is installed                      |
| disco.interaction | theme_install_cancel | [theme/statictheme]     | [theme name]        | Theme install is cancelled              |
| disco.interaction | theme_install_start  | [theme/statictheme]     | [theme name]        | Theme install started                   |
| disco.interaction | theme_uninstall      | [theme/statictheme]     | [theme name]        | Theme uninstalled                       |
