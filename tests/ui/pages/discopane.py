from pypom import Page
from selenium.webdriver.common.by import By


class DiscoveryPane(Page):

    _discopane_content_locator = (By.CSS_SELECTOR, '.disco-pane')
    _play_video_locator = (By.CSS_SELECTOR, '.play-video')
    _uninstalled_toggles_locator = (By.CSS_SELECTOR, '.switch.uninstalled')
    _close_video_link_locator = (By.CSS_SELECTOR, '.close-video')
    _see_more_addons_locator = (By.CSS_SELECTOR, '.amo-link')
    _search_box_locator = (By.ID, 'lst-ib')

    @property
    def is_video_playing(self):
        return self.is_element_present(*self._close_video_link_locator)

    @property
    def is_video_closed(self):
        return self.is_element_present(*self._play_video_locator)

    def play_video(self):
        self.find_element(*self._play_video_locator).click()
        self.find_element(*self._close_video_link_locator)

    def close_video(self):
        self.find_element(*self._close_video_link_locator).click()
        self.find_element(*self._play_video_locator)

    @property
    def is_discopane_visible(self):
        return self.is_element_present(*self._discopane_content_locator)

    @property
    def uninstalled_addons(self):
        return self.find_elements(*self._uninstalled_toggles_locator)

    @property
    def is_see_more_addons_displayed(self):
        return self.is_element_displayed(*self._see_more_addons_locator)
