"""Configuration fixtures and functions for pytest."""

import sys

import pytest

from pages.discopane import DiscoveryPane


@pytest.fixture
def capabilities(capabilities):
    """Set Firefox capabilities."""
    capabilities['marionette'] = True
    capabilities['acceptInsecureCerts'] = True
    return capabilities


@pytest.fixture
def my_base_url(base_url, firefox):
    """Create custom base url depending on os and firefox version."""
    ff_version = firefox.browser.firefox_version
    os = sys.platform
    return '{0}/discovery/pane/{1}.0/{2}/normal'.format(
        base_url, ff_version, os)


@pytest.fixture
def open_discopane(my_base_url, selenium):
    """Open discopane via the menu."""
    with selenium.context(selenium.CONTEXT_CHROME):
        toolbar = selenium.find_element_by_id('menu_ToolsPopup')
        toolbar.click()
        addons = selenium.find_element_by_id('menu_openAddons')
        addons.click()
    return DiscoveryPane(selenium, my_base_url).wait_for_page_to_load()


@pytest.fixture
def discovery_pane(selenium, my_base_url):
    """Open the discovery pane via the URL."""
    return DiscoveryPane(selenium, my_base_url, timeout=30).open()


@pytest.fixture
def firefox_options(firefox_options):
    """Configure Firefox preferences and additonal arguments."""
    firefox_options.add_argument('-foreground')
    firefox_options.set_preference('extensions.webapi.testing', True)
    firefox_options.set_preference('ui.popup.disable_autohide', True)
    firefox_options.set_preference('xpinstall.signatures.dev-root', True)
    return firefox_options
