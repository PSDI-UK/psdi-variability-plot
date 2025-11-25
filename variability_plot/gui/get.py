"""
# get.py

This module defines the various webpages (the "GET" methods) provided by the website, connecting them to relevant
functions to return rendered templates.
"""


from flask import Flask, render_template

from variability_plot.gui.env import get_env_kwargs


def index():
    """Return the web page along with relevant data
    """
    return render_template("index.html",
                           **get_env_kwargs())


# Dict of all pages to be rendered for the site, with the key being the relative path to the page, and the value
# being the function for rendering the page
d_pages = {"/": index,
           "/index.html": index}


def init_get(app: Flask):
    """Connect the provided Flask app to each of the pages on the site
    """

    for path, func in d_pages.items():
        app.route(path)(func)
