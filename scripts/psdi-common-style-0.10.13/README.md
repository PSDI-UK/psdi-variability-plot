# PSDI Common Style

This project provides common resources to help provide a consistent style across PSDI websites. The contents of this project are are deployed live at the various subdirectories of https://psdi-uk.github.io/psdi-common-style/, and can be imported by other projects to use the PSDI style and elements.

## Contributors

- Bryan Gillis (coding)
- Cerys Willoughby (design)

## Provided Resources

### Images

**Deployed at:** https://psdi-uk.github.io/psdi-common-style/img/

This folder contains various images used in the common PSDI header and footer, including a favicon, PSDI and UKRI logos, and icons for social links. Most of the images are linked in the header and footer elements, with the exception of the favicon, which needs to be linked in the header of each HTML file with a line such as:

```HTML
<link rel="icon" type="image/x-icon" href="https://psdi-uk.github.io/psdi-common-style/img/psdi-icon-dark.svg">
```

### Stylesheet

**Deployed at:** https://psdi-uk.github.io/psdi-common-style/css/psdi-common.css

A common CSS stylesheet which can be used for PSDI sites. If no extra styling is required, it can be used directly in the HTML header of a webpage through adding the following line to the header:

```HTML
<link rel="stylesheet" href="https://psdi-uk.github.io/psdi-common-style/css/psdi-common.css">
```

Alternatively, it can be imported at the top of a CSS stylesheet which provides further custom styling with the following command, placed at the top of the file:

```CSS
@import url("https://psdi-uk.github.io/psdi-common-style/css/psdi-common.css");
```

### Scripts

**Deployed at:** https://psdi-uk.github.io/psdi-common-style/js/psdi-common.js

This file provides JavaScript functions used to handle AJAX loading of the common header and footer, plus the code for the light-mode/dark-mode toggle button in the common header.

### HTML Elements

#### Common Footer

**Deployed at:** https://psdi-uk.github.io/psdi-common-style/html/psdi-common-footer.html

This file provides the HTML for the common footer on PSDI sites, which can be loaded into a page via AJAX scripting or incorporated directly through the site's builder (implementation details will differ depending on the builder used). For proper formatting, it must be loaded into or put within an element of the form:

```HTML
<footer class="footer" id="psdi-footer"></footer>
```

#### Common Header

**Deployed at:** https://psdi-uk.github.io/psdi-common-style/html/psdi-common-header.html

This file provides the HTML for the common header on PSDI sites, which can be loaded into a page via AJAX scripting or incorporated directly through the site's builder (implementation details will differ depending on the builder used). For proper formatting, it must be loaded into or put within an element of the form:

```HTML
<header class="header" id="psdi-header"></header>
```

The header is customisable for each site, and at minimum, the site title will need to be set for it. If the header is loaded through AJAX scripting, this can be done through a script such as the following somewhere on the page (ideally immediately after the header element):

```HTML
<script type="module">
import { setTitle,setBrandLinkTarget, setHeaderLinksSource } from
    "https://psdi-uk.github.io/psdi-common-style/js/psdi-common.js";
setTitle("Site Title");
setBrandLinkTarget("./");
setHeaderLinksSource("./header-links.html");
</script>
```

Let's explain each of these functions:

* `setTitle()`

This determines the text that will appear in the header, identifying the website (the whole site, not the specific page). If this function is not called, the text will be blank.

* `setBrandLinkTarget()`

This sets the target that the PSDI brand in the header (including site title) will link to. By default, this is "./", which will link to an "index.html" page in the same directory as this file. If this default is fine, this function does not need to be called. If not (e.g. if the site's homepage is in a different directory), it must be called to set the proper address.

* `setHeaderLinksSource()`

This sets the location of an html file which should contain a list of links which you wish to appear in the top-right of the header, typically linking to different pages within the site. The content of this file should look something like:

```HTML
<a href="./index.html" class="navbar__item navbar__link">Home</a>
<a href="./page-one.html" class="navbar__item navbar__link">Page One</a>
<a href="./page-two.html" class="navbar__item navbar__link">Page Two</a>
```

The default source is "./header-links.html", which is relative to the location of the individual file (not the root of the site). If this is fine, you can create a "header-links.html" file and place it in the same directory as the other ".html" files, and this function call can be removed.

It is possible for different pages within the same site to each link to different files for their header links, for instance if they use relative links and some files are in different directories. This can be done without this function call if you place a different "header-links.html" file in each directory.

Some situations in which you might need to call this function are:

* You wish to put the header links in a file with a different name
* You wish for the header links to differ between different pages in the same directory
* It is not possible or convenient to put a "header-links.html" file alongside a page (e.g. if the page needs to be built and placed in a directory which doesn't yet exist)

## How to Use

There are two ways to use the assets provided by this project: The versions deployed by GitHub Pages can be used live, or they can be downloaded in a release of this project and use locally as resources for your site builder. These options are discussed in detail in the following sections.

In short, using the live versions is easier to set up for most builders, but can increase page load times and carries the risk of the page failing if this project goes down or a bug is inadvertently deployed to the production branch. Downloaded assets allows for more careful control of them, with less risk of an upstream change or downtime causing site failure, but will require more work to implement and maintain.

A hybrid approach is also possible, such as using remote images, stylesheets, and JS scripts, but downloading and incorporating HTML elements with your site builder. Since the HTML elements are the cause of longer page load times when used live, incorporating them as downloaded assets instead will eliminate this drawback and not involve as much work as downloading and using all assets.

### Using Live Versions

**Advantages:**

* Easier to set up in most cases, especially for static HTML sites which don't already use a builder
* Updates to common elements will be applied immediately, without needing to wait for a rebuild

**Disadvantages:**

* May be difficult or impossible to implement with some site builders (notably Docusaurus)
* In the case that a breaking change and/or bug is pushed through to this project, or the site for this project goes down, will immediately affect and break the display of dependent project
* For live versions of HTML elements in particular, will result in slightly longer load times for pages
* Customisation of common HTML elements is limited to what the interface provides

#### Images

Images are the simplest resource to use live. Simply set the `<img>` element to point directly to the live source, e.g.:

```HTML
<img src="https://psdi-uk.github.io/psdi-common-style/img/psdi-logo-darktext.png" alt="PSDI logo" class="lm-only">
```

This will generally have no negative impact on load time compared to using a local image resource.

#### Stylesheet

The PSDI common stylesheet can be used in one of two ways. You can either use it directly in your HTML files by adding the following line to their headers:

```HTML
<link rel="stylesheet" href="https://psdi-uk.github.io/psdi-common-style/css/psdi-common.css">
```

Or include it in an existing stylesheet by adding the following line to the top, before any declarations:

```CSS
@import url("https://psdi-uk.github.io/psdi-common-style/css/psdi-common.css");
```

If you choose to link to the stylesheet within your HTML files, keep in mind that the order that CSS declarations are made matters, with later declarations having precedence. This means that you'll generally want to declare the common stylesheet before any custom stylesheet you might have, so you can selectively override declarations in it as needed.

Linking a remote stylesheet in either of these methods will generally have no negative impact on load time compared to using a local stylesheet.

#### Scripts

At present, the common script file is only necessary to use if you're also using the common HTML elements (whether using them live or building with them). If you are doing this, you must import the script in any HTML file which loads these elements by adding the following lines to their headers:

```HTML
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.3/jquery.min.js"></script>
<script src="https://psdi-uk.github.io/psdi-common-style/js/psdi-common.js" type="module"></script>
```

The former line loads JQuery, which is a dependency for the common script, and the second line loads the script itself. This will set up necessary functions to be called when the page is otherwise finished loading to load in the common HTML elements (if applicable), hook up JS functions where applicable, and remove the page loading cover if one exists.

#### HTML Elements

Common HTML elements are the most difficult to use live, thanks to the fact that HTML has no built-in mechanism to reuse code elements. The solution we've determined to be best for live use of these elements is to have them loaded in by JavaScript code when the page is otherwise finished loading. This requires the following steps to implement for each page which uses these elements:

First, include the appropriate scripts in the file. See [the section above](#scripts-1) for how to load the live versions of these scripts. This will set up the appropriate functions to handle loading in elements when the page is otherwise loaded and setting up other functionality.

If you wish to add the common header to your page, add the following stub HTML element where you want it to appear (typically at or near the top of the `<body>` element):

```HTML
<header class="header" id="psdi-header"></header>
```

The JS code will look for this element to determine where to load in the header. It is important that this element contains no child elements, as they will be overwritten by the loading anyway, and the code will check for their presence to determine whether or not live loading is desired, using the presence of child elements as an indication that live loading is not desired.

The header allows customisation of various attributes. These can be configured by adding the following snippet somewhere on the page, ideally right after the header stub:

```HTML
  <script type="module">
    import { setTitle, setBrandLinkTarget, setHeaderLinksSource } from
      "https://psdi-uk.github.io/psdi-common-style/js/psdi-common.js";
    // The following functions are used to set the site title, the link target of clicking on the brand in the
    // header, and the HTML file to be used as a source for the links to appear in the header of this page. The values
    // currently supplied for the latter two elements are the defaults - if they're fine, those function calls can be
    // deleted to save space. Otherwise, they can be modified to set the desired values. The default title is blank,
    // and so it should always be modified to show the proper page title.
    setTitle("TODO: Place title here");
    setBrandLinkTarget("./");
    setHeaderLinksSource("./header-links.html");
  </script>
```

The desired site title and target for when the user clicks on the brand in the header can be updated simply. Setting up links that you wish to appear in the header takes a bit more work though. In addition to setting the name of a file where these links can be found in this function calls, you also have to create this file and deploy it alongside the other pages of your site. The contents of this should look something like:

```HTML
<a href="./index.html" class="navbar__item navbar__link">Home</a>
<a href="./page-one.html" class="navbar__item navbar__link">Page One</a>
<a href="./page-two.html" class="navbar__item navbar__link">Page Two</a>
```

Typically, the same header links file will be used for all pages in a site, but different files can be used for different pages if desired; they simply need to point to different files in their function calls to `setHeaderLinksSource`.

The common footer can be added just like the header, though it doesn't allow any customisation. Simply add the following stub HTML element where you want the footer to appear in your page (typically at or near the bottom of the `<body>` element):

```HTML
<footer class="footer" id="psdi-footer"></footer>
```

The above will result in the header and footer loading in momentarily after the rest of the page. This can result in a disruptive experience for the user, so one thing you may want to do is add a page cover until this loading is finished. With the common [scripts](#scripts-1) and [stylesheet](#stylesheet-1), all you need to add to enable this feature is the following HTML element somewhere in the `<body>` of your page:

```HTML
<!-- Cover to hide element loading and make page transitions seem smoother -->
<div id="cover"></div>
```

The common stylesheet sets this cover to match the page's background color, in front of all other elements. The common scripts set it to disappear as soon as both the header and footer are loaded or fail to load. If anything goes wrong and the trigger to hide it isn't called for some reason, the cover will fade away over the course of one second.

### Downloading and Building

**Advantages:**

* More resilient to outages and bugs; things can only possibly break when your project triggers a build
* Can work with any site builder, including ones such as Docusaurus which can't use live assets
* Can avoid longer page loads which result from loading remote HTML assets
* Allows deeper customisation of HTML elements

**Disadvantages:**

* More work to implement for most site builders
* Updates to common assets won't be reflected until site is rebuilt

#### Overview

This project makes available the common assets in [its various subfolders](#provided-resources). The general procedure for using them is:

1. In the build step of your project, download the contents of this repository
2. Extra the repository and copy the contents to a location accessible by your site builder
3. Make any desired customisations to the assets
4. Build with your site builder

This procedure is flexible and can be set up as you like. For convenience, this project provides a script in the root directory, `fetch-common-style.sh`, along with a configuration file for it, `fetch-common-style.conf`, plus other bash scripts that it calls in the `scripts/` directory, which handle the most common use cases of using these assets. This section will cover using this script, but you don't need to be limited by it. Feel free to use your own script or modify this script for your purposes if needed.

Whatever you choose to do, you will need some script to handle it. Here we will assume you decide to use this script. To do this, you'll need to:

1. Copy the latest version of `fetch-common-style.sh` and `fetch-common-style.conf` from this project to the root directory of your project.
2. Modify the configuration in `fetch-common-style.conf` as desired
3. Update the build steps of your project so that `fetch-common-style.sh` is called before your site is built

The following sections go over this script and its configuration in more detail.

#### The Fetch Script

The fetch script executes the following actions:

1. Downloads the desired release of this project, unless it's already been downloaded
2. Extracts the common assets and copies them to the desired locations
3. Modifies some of the copied assets according to configuration settings
4. (Optional) Cleans up the downloaded project release and extracted assets, leaving only the copies
5. (Otherwise) Creates a script `cleanup-common-style.sh` which can be called to delete all copies of the assets, leaving behind the downloaded project and its folder of extracted assets, and a script `purge-common-style.sh` which does this and also deletes the downloaded assets and these two scripts

This script takes no command-line arguments; all configuration of its functionality is handled by the variables set in `fetch-common-assets.conf`, which should be present in the same folder as it. It is alternatively possible to set the configuration through specifying variables in the execution of this script when the configuration file is absent, but this is not recommended unless it is fine to use all or nearly-all default values.

The final step of this script creates two other scripts, `cleanup-common-style.sh` and `purge-common-style.sh`, which delete copied assets, the latter also deleting the downloaded files and these two scripts. The purpose of these scripts is to help with a "clean" or "purge" step provided by your site builder, to also remove any assets downloaded/copied by the fetch script. This can be useful for instance if the copied versions aren't listed in your `.gitignore` file and you wish not to commit them; you can call the cleanup script before committing all changes.

It is recommended to set up your `.gitignore` file to ignore downloaded assets and the generated `cleanup-common-style.sh` and `purge-common-style.sh`. This can be done by adding the following lines to it:

```
# Script created to clean up downloaded assets
cleanup-common-style.sh

# Downloaded assets
psdi-assets.tar.gz
psdi-common-style-*.*.*
```

Ideally, you will also want to ignore the copied versions of these assets. If it is possible to keep them separate from all assets deployed with your project (e.g. place all of these assets in a "downloaded_assets" directory which contains nothing else), you can add this location to your `.gitignore`. Otherwise, you can add them individually by name, or else use the cleanup script to remove them so they won't end up committed to your repository.

#### Fetching Configuration

The configuration file `fetch-common-style.conf` in this repository can be copied to your project to use for configuring the fetch script. It must be placed in the same directory as that script so that it can be found. The comments in that file explain the purpose of each option, so here we will simply go over the most important bits to pay attention to.

Each option can be set to use a reasonable default value by leaving the line blank after the variable, i.e. you will get the default version option with the line:

```BASH
export ASSET_VER=
```

And you can request a specific version with:

```BASH
export ASSET_VER="v0.1.0"
```

The default options will usually be fine for most cases, with the one notable exception being the `SITE_TITLE` option, which sets the title of the website displayed in the header (if you don't use the common HTML element for the header though, you don't need to worry about this). As each site will have a different title, this will of course need to be set individually for your project. Note that the site title will be displayed immediately to the right of the PSDI logo, so you can leave "PSDI" out of the title. E.g. if your project is the PSDI Tutorial Centre, you would want to set the title as:

```BASH
export SITE_TITLE="Tutorial Centre"
```

By default, the assets will be copied to `css`, `html`, `img`, and `js` directories within the same directory as the fetch script. This can be modified either by setting the `TARGET_BASE_DIR` option for the directory to contain all of these subdirectories, or the `TARGET_CSS_DIR`, `TARGET_IMG_DIR`, etc. options to directly set the subdirectly for each asset type to be copied to.

## Dependent Projects

The following projects use public resources deployed by this project, and should be tested before any changes are made live to ensure no bugs are introduced:

* [PSDI Metadata](https://github.com/PSDI-UK/metadata) (live)
* [Docusaurus Pages](http://github.com/PSDI-UK/docusaurus-pages) (downloaded)
* [PSDI Home](https://psdistg.wpengine.com/) (live)

## Testing

In order to allow testing of changes to the deployed assets of this project without risk of breaking something, the recommended procedure is to deploy the changes in a fork in the user's namespace. The recommended procedure for testing is:

1. Prepare all changes in a feature branch.
2. When ready, push the feature branch to the fork, and merge it into the `main` branch of the fork. If this is the first time setting up the fork, you will need to manually enable GitHub Pages and the deployment workflow for it, then trigger the workflow
3. Wait for the GitHub Actions job on the fork has completed and the changes to be live
4. For each dependent project in [the list above](#dependent-projects) (ideally all of them, but at minimum test on one which uses all changed elements):
    1. Pull the most recent version of its `main` branch locally
    2. If desired, create a temporary branch for testing any changes
    3. Do a global find-and-replace in the project of "psdi-uk.github.io/css-template" to "brgillis.github.io/css-template"
    4. Save all changed files, and do a clean local build of the project
    5. Check the built site locally and ensure that all components provided by this project are working correctly
    6. If any issues are found, correct them, wait for redeployment, and repeat until checks pass for all dependent projects
5. Once all checks pass, clean up any changes to projects you were testing with (reset if you didn't commit anything, or if on a branch, switch back to the main branch and discard the testing branch), open a pull request to merge the `main` branch of the fork into the `main` branch of the origin project
6. Undertake standard checks for a PR, and once it's passed, the branch can be merged
7. Clean up, including pushing the new state of the origin project to the fork

## Copyright and License

Copyright (c) PSDI Organisation, Bryan Gillis 2024

Official license is awaiting the development of an official PSDI licensing policy.
