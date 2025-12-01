#!/bin/bash

# This script clears content copied from one directory to another, leaving alone any content in the target that
# wasn't created by copying from the source

DEFAULT_CONTENT_TYPE=img

# The ennvar CONTENT_TYPE can be used to set the type of content to be copied. Valid values should match one of the
# directory names in this project (e.g. "img", "js", etc.)
if [ -z ${CONTENT_TYPE+x} ]; then
  CONTENT_TYPE=$DEFAULT_CONTENT_TYPE
fi

ROOT=$(dirname -- $(readlink -f $BASH_SOURCE))/..
SOURCE_DIR=$ROOT/$CONTENT_TYPE
DEFAULT_TARGET_DIR=$ROOT/../$CONTENT_TYPE

# The ennvar TARGET_DIR can be used to set the target directory to copy files to
if [ -z $TARGET_DIR ]; then
  TARGET_DIR=$DEFAULT_TARGET_DIR
fi

# Silently exit if the target directory doesn't exist
if [ ! -d $TARGET_DIR ]; then
    exit 0
fi

for SOURCE_FILENAME in $SOURCE_DIR/*; do
    FILENAME=$(basename ${SOURCE_FILENAME})
    DEST_FILENAME="$TARGET_DIR/$FILENAME"
    if [ -f $DEST_FILENAME ]; then
        rm $DEST_FILENAME
    fi
done

# Remove any created directories if present and empty, up to two levels up from the target
rmdir --ignore-fail-on-non-empty $TARGET_DIR $TARGET_DIR/.. $TARGET_DIR/../.. >/dev/null 2>&1
