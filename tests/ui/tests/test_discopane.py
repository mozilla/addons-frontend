"""Discovery pane tests."""

import pytest
from selenium.webdriver.support.wait import WebDriverWait


@pytest.fixture
def incorrect_disco_url(firefox_options):
    """Fixture to setup an incorrect discovery URL."""
    firefox_options.set_preference(
        'extensions.webservice.discoverURL', 'addons')
    return firefox_options


@pytest.mark.nondestructive
def test_discopane_loads(discovery_pane):
    """Test that discovery pane loads."""
    assert discovery_pane.is_header_displayed


@pytest.mark.nondestructive
def test_see_more_button_is_displayed(discovery_pane):
    """Test to make sure the see more button is displayed."""
    assert discovery_pane.is_see_more_btn_displayed


@pytest.mark.nondestructive
def test_addon_installs(discovery_pane, firefox, notifications):
    """Test addon installation from discovery pane."""
    addon = discovery_pane.addons[0]
    addon.install()
    firefox.browser.wait_for_notification(
        notifications.AddOnInstallConfirmation).install()
    WebDriverWait(firefox.selenium, timeout=5).until(
        lambda _: addon.is_installed)


@pytest.mark.nondestructive
def test_theme_installs(discovery_pane, firefox, notifications):
    """Test static theme install from discovery pane."""
    theme = discovery_pane.themes[0]
    theme.install()
    firefox.browser.wait_for_notification(
        notifications.AddOnInstallConfirmation).install()
    WebDriverWait(firefox.selenium, timeout=5).until(
        lambda _: theme.is_installed)
