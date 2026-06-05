#!/usr/bin/env python

# Selenium test script for PSDI Variability Plot Service.

import os
import time
from multiprocessing import Process
from typing import Callable
import re

import pytest

import psdi_variability_plot

# Skip all tests in this module if required packages for GUI testing aren't installed
try:
    from selenium import webdriver
    from selenium.webdriver import FirefoxOptions
    from selenium.webdriver.common.action_chains import ActionChains
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.firefox.service import Service as FirefoxService
    from selenium.webdriver.firefox.webdriver import WebDriver
    from selenium.webdriver.remote.errorhandler import MoveTargetOutOfBoundsException
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait
    from webdriver_manager.firefox import GeckoDriverManager

    from psdi_variability_plot.gui.setup import start_app

except ImportError:
    # We put the importorskip commands here rather than above so that standard imports can be used by static analysis
    # tools where possible, and the importorskip is used here so pytest will stop processing immediately if things can't
    # be imported - pytest.mark.skip won't do that
    pytest.importorskip("Flask")
    pytest.importorskip("selenium")
    pytest.importorskip("webdriver_manager.firefox")

DEFAULT_ORIGIN = "http://127.0.0.1:5000"

# Timeout for waiting for things, and step of time we'll check at
TIMEOUT_LONG = 10
TIMEOUT_SHORT = 1
TIMESTEP = 0.1


origin = os.environ.get("ORIGIN", DEFAULT_ORIGIN)


@pytest.fixture(scope="module", autouse=True)
def common_setup():
    """Autouse fixture which starts the app before tests and stops it afterwards"""

    # If the origin is set to something else, don't start the local server here
    if origin != DEFAULT_ORIGIN:
        yield
        return

    server = Process(target=start_app)
    server.start()

    # Change to the root dir of the project for running the tests, in case this was invoked elsewhere
    old_cwd = os.getcwd()
    os.chdir(os.path.join(psdi_variability_plot.__path__[0], ".."))

    yield

    server.terminate()
    server.join()

    # Change back to the previous directory
    os.chdir(old_cwd)


@pytest.fixture(scope="module")
def driver():
    """Get a headless Firefox web driver"""

    driver_path = os.environ.get("DRIVER")

    if not driver_path:
        driver_path = GeckoDriverManager().install()
        print(f"Gecko driver installed to {driver_path}")

    opts = FirefoxOptions()
    opts.add_argument("--headless")
    ff_driver = webdriver.Firefox(service=FirefoxService(driver_path),
                                  options=opts)
    yield ff_driver
    ff_driver.quit()


def wait_for_cover_hidden(root: WebDriver):
    """Wait until the page cover is removed"""
    WebDriverWait(root, TIMEOUT_LONG).until(EC.invisibility_of_element((By.XPATH, "//div[@id='cover']")))


def scroll_element_into_view(driver: WebDriver, e: EC.WebElement):
    driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});", e)
    wait_for_success(lambda: ActionChains(driver).move_to_element(e).perform())
    return e


def wait_for_element(driver: WebDriver | EC.WebElement,
                     xpath: str,
                     root: EC.WebElement | None = None,
                     by=By.XPATH,
                     wait_for_clickable: bool = True) -> EC.WebElement:
    """Shortcut for boilerplate to wait until a web element is visible"""

    if root is None:
        root = driver

    WebDriverWait(root, TIMEOUT_LONG).until(EC.presence_of_element_located((by, xpath)))
    e = root.find_element(by, xpath)

    # Some elements might take some time to load into place, so we loop for a bit to give them a chance to do so if we
    # can't immediately do so
    time_elapsed = 0
    while time_elapsed < TIMEOUT_LONG:
        try:
            scroll_element_into_view(driver, e)
            break
        except MoveTargetOutOfBoundsException:
            time_elapsed += TIMESTEP
            time.sleep(TIMESTEP)

    if wait_for_clickable:
        WebDriverWait(root, TIMEOUT_LONG).until(EC.element_to_be_clickable((by, xpath)))

    return e


def wait_for_condition(cond: Callable, timeout=TIMEOUT_SHORT) -> bool:
    """Waits for a condition to be true, return True if it is within the timeout, False otherwise"""

    time_elapsed = 0

    while time_elapsed < timeout:
        if cond():
            break
        time_elapsed += TIMESTEP
        time.sleep(TIMESTEP)

    else:
        return False

    return True


def wait_for_success(action: Callable, timeout=TIMEOUT_SHORT):
    """Waits for an action to be successful, return True if it is within the timeout, False otherwise"""

    time_elapsed = 0

    while time_elapsed < timeout:
        try:
            action()
            break
        except Exception:
            time_elapsed += TIMESTEP
            if time_elapsed >= timeout:
                raise


def wait_for_n_elements(driver, xpath, n, timeout=10):
    return WebDriverWait(driver, timeout).until(
        lambda d: len(d.find_elements(By.XPATH, xpath)) == n
    )


def setup_test_plot(driver: WebDriver):

    # Load the home page and wait for the page cover to be removed.
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Find the select.
    reaction_outcome_type = wait_for_element(driver, "//select[@id='chartType']")

    # Select "Other" reaction type.
    reaction_outcome_type.send_keys("spect")

    # Enter values 40, 55 and 50.
    driver.find_element(By.XPATH, "//input[@id='value-0']").send_keys("40")
    driver.find_element(By.XPATH, "//input[@id='value-1']").send_keys("55")
    driver.find_element(By.XPATH, "//input[@id='value-2']").send_keys("50")

    # Enter "Product" as the product type.
    product = wait_for_element(driver, "//*[@data-placeholder='e.g., Amine 2'][@contenteditable='true']")
    WebDriverWait(driver, 10).until(EC.visibility_of(product))
    WebDriverWait(driver, 10).until(EC.element_to_be_clickable(product))

    product.click()
    product.send_keys("Product")


def test_initial_frontpage(driver: WebDriver):
    """A basic unit test that checks that the front page is displayed with the expected content"""

    # Load the home page and wait for the page cover to be removed.
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Check that the front page contains the header "PSDI Variability Plot".

    element = wait_for_element(driver, "//header//h5")
    assert element.text == "Variability Plot Generator"


def test_paragraph_text(driver: WebDriver):
    """Test that the page contains 'Enter a minimum of three values'"""

    # Load the home page and wait for the page cover to be removed.
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Ensure that the page contains the expected text.
    driver.find_element(By.XPATH, "//p[contains(., 'Enter a minimum of three values')]")


def test_reaction_outcome_select(driver: WebDriver):
    """Test that the reaction outcome select contains the expected items"""

    # Load the home page and wait for the page cover to be removed.
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Find the select.
    wait_for_element(driver, "//select[@id='chartType']")

    # Ensure that it contains the expected items.
    driver.find_element(By.XPATH, "//select[@id='chartType']/option[contains(., 'Isolated yield (%)')]")
    driver.find_element(By.XPATH, "//select[@id='chartType']/option[contains(., 'Spectroscopic yield (%)')]")
    driver.find_element(By.XPATH, "//select[@id='chartType']/option[contains(., 'Chromatographic yield (%)')]")
    driver.find_element(By.XPATH, "//select[@id='chartType']/option[contains(., 'ee (%)')]")
    driver.find_element(By.XPATH, "//select[@id='chartType']/option[contains(., 'de (%)')]")


def test_other_reaction_outcome(driver: WebDriver):
    """Test that the other reaction outcome UI works as expected"""

    # Load the home page and wait for the page cover to be removed.
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Find the select.
    reaction_outcome_type = wait_for_element(driver, "//select[@id='chartType']")

    # Select "Other" reaction type.
    reaction_outcome_type.send_keys("other")

    # Ensure that the other reaction type box appears.
    other_type = wait_for_element(driver, "//*[@data-placeholder='Define outcome'][@contenteditable='true']")
    WebDriverWait(driver, 10).until(EC.visibility_of(other_type))
    WebDriverWait(driver, 10).until(EC.element_to_be_clickable(other_type))

    # Enter "Special yield" as other reaction type.
    other_type.click()
    other_type.send_keys("Special yield")

    # Check that the text was entered correctly.
    wait_for_element(driver, "//*[@data-placeholder='Define outcome'][contains(., 'Special yield')]")


def test_value_field_management(driver: WebDriver):
    """Test that the value input fields can be managed"""

    # Load the home page and wait for the page cover to be removed.
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Find the number of values field.
    num_values = wait_for_element(driver, "//input[@id='numValues']")

    # Try to enter '2' for the number of values.
    WebDriverWait(driver, 10).until(EC.element_to_be_clickable(num_values))
    num_values.send_keys(Keys.BACKSPACE)
    num_values.send_keys(Keys.DELETE)
    num_values.send_keys("2")
    num_values.send_keys(Keys.TAB)

    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return arguments[0].value", num_values) == "3"
    )

    # Enter values 40, 55 and 50.
    wait_for_element(driver, "//input[@id='value-0']").send_keys("40")
    wait_for_element(driver, "//input[@id='value-1']").send_keys("55")
    wait_for_element(driver, "//input[@id='value-2']").send_keys("50")

    # Set to ten values.
    num_values.send_keys(Keys.BACKSPACE)
    num_values.send_keys(Keys.DELETE)
    num_values.send_keys("10")
    num_values.send_keys(Keys.TAB)

    wait_for_n_elements(driver, "//input[starts-with(@id,'value-')]", 10)

    # Remove value '55'.
    wait_for_element(driver, "//button[@id='remove-1']").click()

    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return document.querySelector('input[id=value-1]').value") == "50"
    )

    # Add an empty field after first value input.
    wait_for_element(driver, "//button[@id='add-0']").click()

    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return document.querySelector('input[id=value-1]').value") == ""
    )

    # Decrease number of input fields using stepDown. (same as clicking down arrow in number field)
    driver.execute_script("arguments[0].stepDown(); arguments[0].dispatchEvent(new Event('change'))", num_values)
    wait_for_n_elements(driver, "//input[starts-with(@id,'value-')]", 9)

    # Increase number of input fields using stepUp. (same as clicking up arrow in number field)
    driver.execute_script("arguments[0].stepUp(); arguments[0].dispatchEvent(new Event('change'))", num_values)
    wait_for_n_elements(driver, "//input[starts-with(@id,'value-')]", 10)

    # Enter '55' into the second box.
    wait_for_element(driver, "//input[@id='value-1']").send_keys("55")


def test_confidence_level_select(driver: WebDriver):
    """Test that the confidence level select contains the expected items"""

    # Load the home page and wait for the page cover to be removed.
    driver.get(f"{origin}/")
    wait_for_cover_hidden(driver)

    # Find the select.
    wait_for_element(driver, "//select[@id='significance']")

    # Ensure that it contains the expected items.
    driver.find_element(By.XPATH, "//select[@id='significance']/option[contains(., '90')]")
    driver.find_element(By.XPATH, "//select[@id='significance']/option[contains(., '95')]")


def test_that_test_plot_has_correct_data(driver: WebDriver):

    setup_test_plot(driver)

    wait_for_element(driver, "//*[name() = 'svg']/*[name() = 'g'][contains(., 'Mean yield = 48%')]", wait_for_clickable = False)
    wait_for_element(driver, "//*[name() = 'svg']/*[name() = 'g'][contains(., '95% Confidence interval: 29% to 67%')]", wait_for_clickable = False)


def test_that_test_plot_shows_formatted_text(driver: WebDriver):

    setup_test_plot(driver)

    # Enter "Product" as the product type.
    product = driver.find_element(By.XPATH, "//*[@data-placeholder='e.g., Amine 2'][@contenteditable='true']")

    product.click()
    product.clear()

    product.click()

    bold_button = wait_for_element(driver, "//DIV[@id='compoundEditor']/..//BUTTON[contains(@class, 'ql-bold')]")
    italic_button = driver.find_element(By.XPATH, "//DIV[@id='compoundEditor']/..//BUTTON[contains(@class, 'ql-italic')]")
    underline_button = driver.find_element(By.XPATH, "//DIV[@id='compoundEditor']/..//BUTTON[contains(@class, 'ql-underline')]")
    superscript_button = driver.find_element(By.XPATH, "//DIV[@id='compoundEditor']/..//BUTTON[contains(@class, 'ql-script')][@value='super']")
    subscript_button = driver.find_element(By.XPATH, "//DIV[@id='compoundEditor']/..//BUTTON[contains(@class, 'ql-script')][@value='sub']")
    symbol_button = driver.find_element(By.XPATH, "//DIV[@id='compoundEditor']/..//BUTTON[contains(@class, 'insertSymbolButton')]")

    # bold A
    bold_button.click()
    product.send_keys("A")

    # italic n
    bold_button.click()
    italic_button.click()
    product.send_keys("n")

    # underlined i
    italic_button.click()
    underline_button.click()
    product.send_keys("i")

    # superscript l
    underline_button.click()
    superscript_button.click()
    product.send_keys("l")

    # subscript i
    subscript_button.click()
    product.send_keys("b")

    # normal n
    subscript_button.click()
    product.send_keys("n")

    # lower case epsilon
    symbol_button.click()
    epsilon = driver.find_element(By.XPATH, "//DIV[@id='compoundEditor']/..//BUTTON[contains(., 'ε')]")
    WebDriverWait(driver, 10).until(EC.element_to_be_clickable(epsilon))
    epsilon.click()

    # space
    product.send_keys(" ")

    # bold italic underlined subscript pi symbol
    bold_button.click()
    italic_button.click()
    underline_button.click()
    subscript_button.click()
    symbol_button.click()
    pi = driver.find_element(By.XPATH, "//DIV[@id='compoundEditor']/..//BUTTON[contains(., 'π')]")
    WebDriverWait(driver, 10).until(EC.element_to_be_clickable(pi))
    pi.click()

    # Verify that the product appears with specific styles
    assert product.get_attribute("innerHTML") == (
        "<p>"
        "<strong>A</strong>"
        "<em>n</em>"
        "<u>i</u>"
        "<sup>l</sup>"
        "<sub>b</sub>"
        "nε "
        "<sub><strong><em><u>π</u></em></strong></sub></p>"
    )

    title_element = wait_for_element(driver, "//*[name() = 'svg']/*[name() = 'g'][contains(., 'spectroscopic')]")
    y_axis_label = wait_for_element(driver, "//*[name() = 'svg']/*[name() = 'g'][contains(., 'Spectroscopic')]")


def test_that_chart_size_changes_work(driver: WebDriver):

    setup_test_plot(driver)

    widthInput = wait_for_element(driver, "//input[@id='chartWidth']")
    heightInput = wait_for_element(driver, "//input[@id='chartHeight']")

    driver.execute_script("arguments[0].stepDown()", widthInput)

    WebDriverWait(driver, 10).until(
        lambda d: widthInput.get_attribute("value") == "640"
    )

    driver.execute_script("arguments[0].stepDown()", heightInput)

    WebDriverWait(driver, 10).until(
        lambda d: heightInput.get_attribute("value") == "480"
    )

    widthInput.send_keys(Keys.CONTROL + "a")
    widthInput.send_keys(Keys.DELETE)
    widthInput.send_keys("700")
    widthInput.send_keys(Keys.TAB)

    svg = wait_for_element(driver, "//div[@id='variabilityChart']/*[name()='svg']")

    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return arguments[0].getAttribute('viewBox')", svg) == "0 0 700 480"
    )

    heightInput.send_keys(Keys.CONTROL + "a")
    heightInput.send_keys(Keys.DELETE)
    heightInput.send_keys("550")
    heightInput.send_keys(Keys.TAB)

    svg = wait_for_element(driver, "//div[@id='variabilityChart']/*[name()='svg']")

    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return arguments[0].getAttribute('viewBox')", svg) == "0 0 700 550"
    )

    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return arguments[0].clientWidth", svg) == 640
    )

    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script("return arguments[0].clientHeight", svg) == 480
    )


def test_plot_customisation_font_size(driver: WebDriver):

    setup_test_plot(driver)

    # Title font size test.

    wait_for_element(driver, "//button[@id='customiseChart']").click()
    wait_for_element(driver, "//summary[contains(., 'Fonts')]").click()

    title_font_size = wait_for_element(driver, "//input[@id='titleFontSize']")

    title_font_size.send_keys(Keys.CONTROL + "a")
    title_font_size.send_keys(Keys.DELETE)
    title_font_size.send_keys("15")

    wait_for_element(driver, "//button[@id='closeVariabilityPlotDialog']").click()

    WebDriverWait(driver, TIMEOUT_LONG).until(EC.presence_of_element_located((By.XPATH,
        "//*[name() = 'svg']//*[name() = 'text' and @font-size = '15px' and contains(., 'Variability')]")))

    # Axis label font size test.

    wait_for_element(driver, "//button[@id='customiseChart']").click()

    axis_label_font_size = wait_for_element(driver, "//input[@id='axisFontSize']")

    axis_label_font_size.send_keys(Keys.CONTROL + "a")
    axis_label_font_size.send_keys(Keys.DELETE)
    axis_label_font_size.send_keys("17")

    wait_for_element(driver, "//button[@id='closeVariabilityPlotDialog']").click()

    WebDriverWait(driver, TIMEOUT_LONG).until(EC.presence_of_element_located((By.XPATH,
        "//*[name() = 'svg']//*[name() = 'text' and @font-size = '17px' and contains(., 'Iteration')]")))


def test_plot_customisation_markers(driver: WebDriver):

    setup_test_plot(driver)

    # Set marker type to 'diamond'.

    wait_for_element(driver, "//button[@id='customiseChart']").click()
    wait_for_element(driver, "//summary[contains(., 'Markers')]").click()

    marker_type = wait_for_element(driver, "//select[@id='pointType']")

    marker_type.send_keys("Diamond")

    # Ensure that the markers have changed from circles to unfilled path elements.
    marker = wait_for_element(driver, "//*[name() = 'g' and @class = 'markers']/*[local-name() = 'path' and @fill='none']")

    # Set to marker colour to brown.
    driver.execute_script('document.querySelector("#pointColor").value = "#8b4513"')
    driver.execute_script('document.querySelector("#pointColor").dispatchEvent(new Event("input"))')

    marker = wait_for_element(driver, "//*[name() = 'g' and @class = 'markers']/*[local-name() = 'path' and @stroke='#8b4513']")

    diamond_pattern = '^M ([0-9.]+) ([0-9.]+) L ([0-9.]+) ([0-9.]+) L ([0-9.]+) ([0-9.]+) L ([0-9.]+) ([0-9.]+) Z$'

    # Change marker size to 10.

    match1 = re.match(diamond_pattern, marker.get_attribute("d"))

    point_size_input = wait_for_element(driver, "//input[@id='pointSize']")

    point_size_input.send_keys(Keys.CONTROL + "a")
    point_size_input.send_keys(Keys.DELETE)
    point_size_input.send_keys("10")
    point_size_input.send_keys(Keys.TAB)

    marker = wait_for_element(driver, "//*[name() = 'g' and @class = 'markers']/*[local-name() = 'path']")

    match2 = re.match(diamond_pattern, marker.get_attribute("d"))

    assert(float(match1[2]) < float(match2[2]))

    # Change marker size to 3.

    point_size_input.send_keys(Keys.CONTROL + "a")
    point_size_input.send_keys(Keys.DELETE)
    point_size_input.send_keys("3")
    point_size_input.send_keys(Keys.TAB)

    marker = wait_for_element(driver, "//*[name() = 'g' and @class = 'markers']/*[local-name() = 'path']")

    match3 = re.match(diamond_pattern, marker.get_attribute("d"))

    # print(f"match2 = {match1[2]}")
    # print(f"match2 = {match3[2]}")
    # print(f"match2 = {float(match1[2])}")
    # print(f"match2 = {float(match3[2])}")

    assert(float(match1[2]) > float(match3[2]))


def test_plot_customisation_confidence_interval(driver: WebDriver):

    setup_test_plot(driver)

    # Open customisation dialog and select "Confidence interval"
    wait_for_element(driver, "//button[@id='customiseChart']").click()
    wait_for_element(driver, "//summary[contains(., 'Confidence interval')]").click()

    # Set to band colour to pink.
    wait_for_element(driver, "//input[@id='bandColor']")
    driver.execute_script('document.querySelector("#bandColor").value = "#ffc0cb"')
    driver.execute_script('document.querySelector("#bandColor").dispatchEvent(new Event("input"))')

    marker = wait_for_element(driver, "//*[name() = 'g' and @class = 'confidence']/*[local-name() = 'rect' and @fill='#ffc0cb']")

    # Set CI line to red.
    driver.execute_script('document.querySelector("#meanColor").value = "#ff0000"')
    driver.execute_script('document.querySelector("#meanColor").dispatchEvent(new Event("input"))')

    marker = wait_for_element(driver, "//*[name() = 'g' and @class = 'confidence']/*[local-name() = 'line' and @stroke='#ff0000']")

    # Set CI line to weight of 2
    driver.execute_script('document.querySelector("#meanWeight").value = 2')
    driver.execute_script('document.querySelector("#meanWeight").dispatchEvent(new Event("change"))')

    marker = wait_for_element(driver, "//*[name() = 'g' and @class = 'confidence']/*[local-name() = 'line' and @stroke-width='2']")


def test_plot_calculation_1(driver: WebDriver):

    setup_test_plot(driver)

    value0 = driver.find_element(By.XPATH, "//input[@id='value-0']")
    value1 = driver.find_element(By.XPATH, "//input[@id='value-1']")
    value2 = driver.find_element(By.XPATH, "//input[@id='value-2']")

    # Set values to 30, 55 and 20

    value0.send_keys(Keys.CONTROL + "a")
    value0.send_keys(Keys.DELETE)
    value0.send_keys("30")

    value2.send_keys(Keys.CONTROL + "a")
    value2.send_keys(Keys.DELETE)
    value2.send_keys("20")
    value2.send_keys(Keys.TAB)

    wait_for_element(driver, "//*[name() = 'text'][contains(., '95% Confidence interval: 0% to 80%')]")

    plotBackground = wait_for_element(driver, "//*[local-name()='rect' and @class='plotBackground']") # .get_attribute("cy") != null

    top = float(plotBackground.get_attribute('y'))
    height = float(plotBackground.get_attribute('height'))

    markers = driver.find_elements(By.XPATH, "//*[name() = 'g' and @class = 'markers']/*")

    y0 = (1 - ((float(markers[0].get_attribute("cy")) - top) / height)) * 100
    y1 = (1 - ((float(markers[1].get_attribute("cy")) - top) / height)) * 100
    y2 = (1 - ((float(markers[2].get_attribute("cy")) - top) / height)) * 100

    assert(round(y0, 2) == 30)
    assert(round(y1, 2) == 55)
    assert(round(y2, 2) == 20)

    wait_for_element(driver, "//div[contains(., 'CI extends outside the range of')]")

 
def test_plot_calculation_2(driver: WebDriver):

    setup_test_plot(driver)

    value0 = driver.find_element(By.XPATH, "//input[@id='value-0']")
    value1 = driver.find_element(By.XPATH, "//input[@id='value-1']")
    value2 = driver.find_element(By.XPATH, "//input[@id='value-2']")

    # Set values to 30, 55 and 20

    value0.send_keys(Keys.CONTROL + "a")
    value0.send_keys(Keys.DELETE)
    value0.send_keys("92")

    value1.send_keys(Keys.CONTROL + "a")
    value1.send_keys(Keys.DELETE)
    value1.send_keys("68")

    value2.send_keys(Keys.CONTROL + "a")
    value2.send_keys(Keys.DELETE)
    value2.send_keys("77")
    value2.send_keys(Keys.TAB)

    wait_for_element(driver, "//*[name() = 'text'][contains(., '95% Confidence interval: 49% to 100%')]")

    plotBackground = wait_for_element(driver, "//*[local-name()='rect' and @class='plotBackground']") # .get_attribute("cy") != null

    top = float(plotBackground.get_attribute('y'))
    height = float(plotBackground.get_attribute('height'))

    markers = driver.find_elements(By.XPATH, "//*[name() = 'g' and @class = 'markers']/*")

    y0 = (1 - ((float(markers[0].get_attribute("cy")) - top) / height)) * 100
    y1 = (1 - ((float(markers[1].get_attribute("cy")) - top) / height)) * 100
    y2 = (1 - ((float(markers[2].get_attribute("cy")) - top) / height)) * 100

    assert(round(y0, 2) == 92)
    assert(round(y1, 2) == 68)
    assert(round(y2, 2) == 77)

    wait_for_element(driver, "//div[contains(., 'CI extends outside the range of')]")


def test_plot_calculation_3(driver: WebDriver):

    setup_test_plot(driver)

    # Find the number of values field.
    num_values = wait_for_element(driver, "//input[@id='numValues']")

    # Try to enter '2' for the number of values.
    WebDriverWait(driver, 10).until(EC.element_to_be_clickable(num_values))
    num_values.send_keys(Keys.BACKSPACE)
    num_values.send_keys(Keys.DELETE)
    num_values.send_keys("5")
    num_values.send_keys(Keys.TAB)

    wait_for_n_elements(driver, "//input[starts-with(@id,'value-')]", 5)

    value0 = driver.find_element(By.XPATH, "//input[@id='value-0']")
    value1 = driver.find_element(By.XPATH, "//input[@id='value-1']")
    value2 = driver.find_element(By.XPATH, "//input[@id='value-2']")
    value3 = driver.find_element(By.XPATH, "//input[@id='value-3']")
    value4 = driver.find_element(By.XPATH, "//input[@id='value-4']")

    # Set values to 30, 55 and 20

    value0.send_keys(Keys.CONTROL + "a")
    value0.send_keys(Keys.DELETE)
    value0.send_keys("97")

    value1.send_keys(Keys.CONTROL + "a")
    value1.send_keys(Keys.DELETE)
    value1.send_keys("97")

    value2.send_keys(Keys.CONTROL + "a")
    value2.send_keys(Keys.DELETE)
    value2.send_keys("91")

    value3.send_keys("75")
    value4.send_keys("88")
    value4.send_keys(Keys.TAB)


    wait_for_element(driver, "//*[name() = 'text'][contains(., '95% Confidence interval: 78% to 100%')]")

    plotBackground = wait_for_element(driver, "//*[local-name()='rect' and @class='plotBackground']") # .get_attribute("cy") != null

    top = float(plotBackground.get_attribute('y'))
    height = float(plotBackground.get_attribute('height'))

    markers = driver.find_elements(By.XPATH, "//*[name() = 'g' and @class = 'markers']/*")

    y0 = (1 - ((float(markers[0].get_attribute("cy")) - top) / height)) * 100
    y1 = (1 - ((float(markers[1].get_attribute("cy")) - top) / height)) * 100
    y2 = (1 - ((float(markers[2].get_attribute("cy")) - top) / height)) * 100
    y3 = (1 - ((float(markers[3].get_attribute("cy")) - top) / height)) * 100
    y4 = (1 - ((float(markers[4].get_attribute("cy")) - top) / height)) * 100

    assert(round(y0, 2) == 97)
    assert(round(y1, 2) == 97)
    assert(round(y2, 2) == 91)
    assert(round(y3, 2) == 75)
    assert(round(y4, 2) == 88)

    wait_for_element(driver, "//div[contains(., 'CI extends outside the range of')]")


def test_download_format_has_svg_and_png(driver: WebDriver):

    setup_test_plot(driver)

    # Find the select.
    wait_for_element(driver, "//select[@id='downloadFormat']")

    # Ensure that it contains the expected items.
    driver.find_element(By.XPATH, "//select[@id='downloadFormat']/option[contains(., 'SVG')]")
    driver.find_element(By.XPATH, "//select[@id='downloadFormat']/option[contains(., 'PNG')]")
