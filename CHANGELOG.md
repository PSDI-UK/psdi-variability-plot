# Changelog for PSDI Variability Plot

## v0.1.6

### Stylistic Change

-Pulled updated common assets, adding link to sitemap to footer

## v0.1.5

### Miscellaneous changes

- Add link back to the Organic Toolkit Hub page

## v0.1.4

### Miscellaneous changes

- Previous location hosted on GitHub pages will now redirect to the new live location at https://organic-toolkit.psdi.ac.uk/variability-plot
- Reusable GitHub workflows now moved to be sourced from the common repo https://github.com/PSDI-UK/psdi-github-workflows-public
- Restored link to project source repo on Documentation page

## v0.1.3

### UX/Stylistic changes

- The plot preview in the customise plot dialog will now update for all color changes before the user clicks away on all browsers

### Bugfixes

- Fixed outlines of select boxes being cut off within the customise plot dialog box in dark mode
- Added handling for if all inputted outcome values are the same or nearly the same and the calculated variance is near-zero or NaN, displaying a warning to the user that this has happened so they aren't confused

## v0.1.2

### Bugfixes

- Fixed the size of downloaded .png plots to be what the user entered rather than always 200x150
- Fixed bug where when the outcome was "de", "ee" would instead be shown in the plot labels

## v0.1.0

Initial public release, providing ability to generate a plot from provided data to illustrate the variability of reaction outcomes. This plot can be configured as desired and exported in either .png or .svg format or copied to clipboard.
