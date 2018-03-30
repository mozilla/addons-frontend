"""Represent the Discovery Pane page."""

from pypom import Page, Region
from selenium.webdriver.common.by import By


class DiscoveryPane(Page):
    """Contain the locators and actions relating to the discovery pane."""

    _root_locator = (By.CLASS_NAME, 'disco-pane')
    _close_video_locator = (By.CLASS_NAME, 'close-video')
    _extensions_locator = (By.CLASS_NAME, 'extension')
    _discopane_error_alert_locator = (
        By.CSS_SELECTOR, '#discover-error .alert')
    _discopane_header_locator = (By.CLASS_NAME, 'disco-header')
    _discovery_list_item_locator = (By.ID, 'category-discover')
    _play_video_locator = (By.CLASS_NAME, 'play-video-text')
    _see_more_btn_locator = (By.CLASS_NAME, 'amo-link')
    _themes_locator = (By.CLASS_NAME, 'theme')

    def _wait_for_page_to_load(self):
        """Wait for page load."""
        self.wait.until(
            lambda s: s.find_element(
                *self._discovery_list_item_locator).is_displayed())
        return self

    @property
    def is_error_alert_displayed(self):
        """Check to see if the error alert is displayed."""
        return self.wait.until(
            lambda s: s.find_element(
                *self._discopane_error_alert_locator).is_displayed())

    @property
    def is_header_displayed(self):
        """Check to see if the header is displayed."""
        return self.is_element_displayed(*self._discopane_header_locator)

    def play_video(self):
        """Plays the welcome video."""
        self.find_element(*self._play_video_locator).click()

    @property
    def is_play_video_displayed(self):
        """Check to see if the welcome video is displayed."""
        return self.is_element_displayed(*self._play_video_locator)

    def close_video(self):
        """Close the welcome video."""
        self.find_element(*self._close_video_locator).click()

    @property
    def is_close_video_displayed(self):
        """Check to see if welcome video is closed."""
        return self.is_element_displayed(*self._close_video_locator)

    @property
    def is_see_more_btn_displayed(self):
        """Check if see ore button is displayed at the bottom of page."""
        return self.is_element_displayed(*self._see_more_btn_locator)

    @property
    def addons(self):
        """List of addons."""
        els = self.find_elements(*self._extensions_locator)
        return [self.Addon(self, el) for el in els]

    @property
    def themes(self):
        """List of themes."""
        els = self.find_elements(*self._themes_locator)
        return [self.Addon(self, el) for el in els]

    class Addon(Region):
        """Contains all locators and functions for extensions and themes."""

        _install_button_locator = (By.CLASS_NAME, 'InstallButton-switch')
        _success_switch_locator = (By.CLASS_NAME, 'Switch--success')

        def install(self):
            """Install the theme or extension."""
            self.find_element(*self._install_button_locator).click()

        @property
        def is_installed(self):
            """Check if theme or extensions is installed."""
            return self.is_element_displayed(*self._success_switch_locator)
