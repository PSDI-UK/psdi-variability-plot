#!/bin/bash

SCRIPTS=$(dirname -- $(readlink -f $BASH_SOURCE))

DEFAULT_TARGET_BASE_DIR=$SCRIPTS/../..

# The ennvar TARGET_BASE_DIR can be used to set the default directory which contains subdirs for each type
if [ -z $TARGET_BASE_DIR ]; then
  TARGET_BASE_DIR=$DEFAULT_TARGET_BASE_DIR
fi

# The ennvar TARGET_CSS_DIR can be used to set the directory to contain css files
if [ -z $TARGET_CSS_DIR ]; then
  TARGET_CSS_DIR=$TARGET_BASE_DIR/css
fi

TARGET_DIR=$TARGET_CSS_DIR CONTENT_TYPE=css $SCRIPTS/clear_dir.sh

# The ennvar TARGET_IMG_DIR can be used to set the directory to contain image files
if [ -z $TARGET_IMG_DIR ]; then
  TARGET_IMG_DIR=$TARGET_BASE_DIR/img
fi

TARGET_DIR=$TARGET_IMG_DIR CONTENT_TYPE=img $SCRIPTS/clear_dir.sh

# The ennvar TARGET_HTML_DIR can be used to set the directory to contain html files
if [ -z $TARGET_HTML_DIR ]; then
  TARGET_HTML_DIR=$TARGET_BASE_DIR/html
fi

TARGET_DIR=$TARGET_HTML_DIR CONTENT_TYPE=html $SCRIPTS/clear_dir.sh

# The ennvar TARGET_JS_DIR can be used to set the directory to contain JS files
if [ -z $TARGET_JS_DIR ]; then
  TARGET_JS_DIR=$TARGET_BASE_DIR/js
fi

TARGET_DIR=$TARGET_JS_DIR CONTENT_TYPE=js $SCRIPTS/clear_dir.sh
