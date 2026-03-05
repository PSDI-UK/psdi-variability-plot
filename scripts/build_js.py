"""@file scripts/build_js.py

Created 2026-03-05 by Bryan Gillis.

Build hooks to install needed Node packages and build .js files before installation
"""
import os
import sys
from subprocess import run
from typing import Any

from hatchling.builders.hooks.plugin.interface import BuildHookInterface  # type: ignore

base_dir = os.path.abspath(os.path.split(__file__)[0] + "/..")
source_bin_dir = os.path.join(base_dir, "psdi_data_conversion/bin")

L_PLATFORMS = ["linux", "windows", "mac"]


class BuildJs(BuildHookInterface):
    """A Hatch plugin calls npm to install and build the project before installation
    """

    PLUGIN_NAME = 'Build JS scripts'

    def initialize(self, version: str, build_data: dict[str, Any]) -> None:

        # Change directory to the module dir while installing and building
        old_cwd = os.getcwd()
        try:
            os.chdir(os.path.join(os.path.dirname(__file__), "../psdi_variability_plot"))
            run("npm install", shell=True, stdout=sys.stdout, stderr=sys.stderr)
            run("npm run build", shell=True, stdout=sys.stdout, stderr=sys.stderr)
        finally:
            os.chdir(old_cwd)
