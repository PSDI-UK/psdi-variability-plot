# Changelog for PSDI Common Style project

## v0.10.13

### Styling Changes

- Increased size of text in announcement bar

## v0.10.12

### Styling Changes

- Fixed announcement bar height for Docusaurus pages

## v0.10.11

### Styling Changes

- Buttons are now a bit more responsive - the cursor changes to a pointer, and they change color when hovered over

## v0.10.10

### Bugfixes

- Fixed so content is less likely to overflow the viewport width

## v0.10.9

### Bugfixes

- Fixed bug where the mode toggle button in the header wasn't always being connected

## v0.10.8

### Bugfixes

- Updated PSDI X link in the footer to point directly to x.com rather than relying on a redirect

## v0.10.7

### Bugfixes

- Fixed bug with horizontal scrollbar on docusaurus sites

## v0.10.6

### Styling Changes

- Header and footer PSDI links now point to production site

## v0.10.5

### Styling Changes

- UKRI and EPSRC logos in the footer now link to their sites

## v0.10.4

### Bugfixes

- Fixed bug with how page titles wrap
- Fixed spacing of title

## v0.10.3

### Bugfixes

- Increased z-index of page cover so it will appear over header on PSDI main page

## v0.10.2

### Bugfixes

- Updated CSS rules to fix a double-spacing issue between paragraphs on some sites

## v0.10.1

### Bugfixes

- Updated CSS styling so settings for horizontal lines won't be overridden by Bootstrap if that's loaded as well

## v0.10.0

### Styling Changes

- Point PSDI Home links to the staging website temporarily

## v0.9.5

### Bugfixes

- Fix "JavaScript disabled" line accidentally left in common footer

## v0.9.4

### Styling Changes

- Added links for Privacy, T&C, and mailing list to footer
- Removed Instagram link from footer
- Updated Copyright year in footer to 2025

## v0.9.3

### Styling Changes

- Expanded PSDI abbreviation in copyright notice in footer
- Added simple versions of PSDI logo, without the expansion of the abbreviation

## v0.9.2

### Miscellaneous Changes

- Updated Contact Us link in footer to support@psdi.ac.uk per feedback at demo

## v0.9.1

### Bugfixes

- Fixed placeholder text formatting in input boxes for improved readability - now appears grey with normal weight

## v0.9.0

### New and Changed functionality

- Added ability for a header or footer to be assigned the "fallback" class to indicate that the existing content is
  there to be used as a fallback for if the remote content can't be loaded, and to try to load the remote content over
  it

## v0.8.0

### New and Changed functionality

- Automatically download fonts used by the style

## v0.7.0

### New and Changed functionality

- Split the links in the brand in the header, so that the PSDI logo will link to the PSDI home page, and the site title
  will link to the site homepage. Renamed `setBrandLinkTarget` function to `setTitleLinkTarget` to reflect this change,
  but kept the previous name so as not to break backwards compatibility

## v0.5.0

### New and Changed functionality

- Deploys assets live, but not in releases, in `store/`, starting with resource catalogue

## v0.4.1

### Bugfixes

- Fixed bug with incorrect default location for HTML assets

### Miscellaneous Changes

- Set up .gitattributes to hide files we don't want appearing in release tarballs

## v0.4.0

### New and Changed Functionality

- Added JavaScript functions to `psdi-common.js`, `setHeaderSource` and `setFooterSource`, to set the location of the header and footer on a per-file basis
- Added configuration option in `fetch-common-style.sh`, `FORCE_OVERWRITE`, which will force the fetch script and copy scripts it calls to overwrite any files that already exist in target destinations

### Bugfixes

- Fixed bug where brand link and title deliberately set in the header would be overwritten by defaults in the JS code

## v0.3.0

### New and Changed Functionality

- Added configuration option in `fetch-common-style.sh`, `HTML_LOC`, which sets the location to load common header and footer from, and functionality in the scripts to support this

## v0.2.7

### Bugfixes

- Fixed bug in CSS which was incorrectly removing list styling globally

## v0.2.6

### Bugfixes

- Fixed background color of selected options

## v0.2.5

### New and Changed Functionality

- Added Verdana as a possible font ahead of Arial

### Bugfixes

- Fixed bug where options selected in a select box would appear to lose their selection after focus is lost

## v0.2.4

### Bugfixes

- Fixed bug where header and footer were still being loaded from css-template project instead of this one

## v0.2.3

### Bugfixes

- Fixed bug where page cover wouldn't be hidded if neither the header nor footer needed to be loaded remotely

## v0.2.2

### New and Changed Functionality

- Added extra specifier for ul declaration in common CSS, so it'll take precedence in the WP site

### Bugfixes

- Fixed bug which occurred in common scripts when header stub wasn't present on a page, which prevented footer from being loaded

## v0.2.1

### New and Changed Functionality

- Changed behavior of `scripts/copy_dir.sh` when a target file already exists to exit with a warning instead of a failure. This is a common occurence in rebuilds, and shouldn't trigger an error

### Bugfixes

- Fixed inconsistent changing of directory in `fetch-common-style.sh`
- Fixed not using default BASE_TARGET_DIR in `fetch-common-style.conf`

### Miscellaneous Changes

- Misc. formatting changes

## v0.2.0

- First feature-complete release

### New and Changed Functionality

- Added script `fetch-common-style.sh` and its configuration file `fetch-common-style.conf` which can be copied to other projects to assist in retrieving assets from this project
- Added ability to set the site title of the common HTML header in `scripts/copy_html.sh`
- Default image locations in `html/psdi-common-header` and `html/psdi-common-footer` updated to use the live images deployed by this project

### Bugfixes

- Reworked logic in `js/psdi-common.js` for loading elements so that elements which already have children won't be overwritten, and to better ensure that the page-loading cover is removed at the correct time

### Documentation Changes

- README.md completed for current version of project
- CHANGELOG.md added
- Improved commenting for `js/psdi-common.js`

### Miscellaneous Changes

- Updated `.gitignore` to include files created while testing this project

## v0.1.0

- Forked from css-template project
- Initial pre-release for the purpose of testing scripts to download releases
