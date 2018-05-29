"""Discovery pane tests."""

import pytest


@pytest.fixture
def incorrect_disco_url(firefox_options):
    """Fixture to setup an incorrect discovery URL."""
    firefox_options.set_preference(
        'extensions.webservice.discoverURL', 'addons')
    return firefox_options


@pytest.mark.nondestructive
def test_discopane_error_loads(incorrect_disco_url, selenium, open_discopane):
    """Test that the error alert shows."""
    discovery_pane = open_discopane
    assert discovery_pane.is_error_alert_displayed


@pytest.mark.nondestructive
def test_discopane_loads(discovery_pane):
    """Test that discovery pane loads."""
    assert discovery_pane.is_header_displayed


@pytest.mark.nondestructive
def test_that_welcome_video_plays(discovery_pane):
    """Test the welcome video."""
    assert not discovery_pane.is_close_video_displayed
    discovery_pane.play_video()
    assert not discovery_pane.is_play_video_displayed
    discovery_pane.close_video()
    assert discovery_pane.is_play_video_displayed
    assert not discovery_pane.is_close_video_displayed


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
    firefox.browser.wait_for_notification(
        notifications.AddOnInstallComplete)
    assert addon.is_installed


@pytest.mark.nondestructive
def test_theme_installs(discovery_pane, firefox, notifications):
    """Test theme install from discovery pane."""
    theme = discovery_pane.themes[0]
    theme.install()
    firefox.browser.wait_for_notification(
        notifications.AddOnInstallConfirmation).install()
    firefox.browser.wait_for_notification(
        notifications.AddOnInstallComplete)
    assert theme.is_installed
