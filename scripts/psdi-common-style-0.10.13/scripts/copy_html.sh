#!/bin/bash

SCRIPTS=$(dirname -- $(readlink -f $BASH_SOURCE))
CONTENT_TYPE=html $SCRIPTS/copy_dir.sh

DEFAULT_TARGET_DIR=$SCRIPTS/../../$CONTENT_TYPE

# The ennvar TARGET_DIR can be used to set the target directory to copy files to
if [ -z $TARGET_DIR ]; then
  TARGET_DIR=$DEFAULT_TARGET_DIR
fi

# If envvars are specific to set specific locations within the copied html files, update the new ones in-place

# Replace the site title in the common header with the desired value
LINE_TO_REPACE_ESCAPED='$REPLACEME_SITE_TITLE'
ESCAPED_SITE_TITLE=$(printf '%s\n' "$SITE_TITLE" | sed -e 's/[\/&]/\\&/g')
REPLACE_CMD="sed -i -e 's/$LINE_TO_REPACE_ESCAPED/$ESCAPED_SITE_TITLE/' $TARGET_DIR/psdi-common-header.html"
eval $REPLACE_CMD

# Backwards compatibility patch - if the old name of "TITLE_LINK" was used, copy its value to TITLE_LINK
if [ ! -z $BRAND_LINK ] && [ -z $TITLE_LINK ]; then
  export TITLE_LINK=$BRAND_LINK
fi

if [ ! -z $TITLE_LINK ]; then
    LINE_TO_REPLACE_LHS='<a class="navbar__title" href="' # Everything before the default link
    LINE_TO_REPLACE_LINK='\.\/' # The default link, escaped for regex input
    LINE_TO_REPLACE_RHS='">' # Everything after the default link
    LINE_TO_REPLACE_ESCAPED='('$LINE_TO_REPLACE_LHS')'$LINE_TO_REPLACE_LINK'('$LINE_TO_REPLACE_RHS')'

    # Replace the title link in the common header with the desired value
    ESCAPED_TITLE_LINK=$(printf '%s\n' "$TITLE_LINK" | sed -e 's/[\/&]/\\&/g')
    REPLACE_CMD="sed -i -E 's/$LINE_TO_REPLACE_ESCAPED/\1$ESCAPED_TITLE_LINK\2/' $TARGET_DIR/psdi-common-header.html"
    eval $REPLACE_CMD
fi

if [ ! -z $HEADER_LINKS_SOURCE ]; then
    # Replace the header links stub in the common header with the desired value
    LINE_TO_REPACE_ESCAPED='<!-- Add common header links here -->'
    ESCAPED_HEADER_LINKS=$(printf '%s\n' "`cat $HEADER_LINKS_SOURCE`" | sed -e 's/[\/&]/\\&/g')
    REPLACE_CMD="sed -i -e 's/$LINE_TO_REPACE_ESCAPED/$ESCAPED_HEADER_LINKS/' $TARGET_DIR/psdi-common-header.html"
    eval $REPLACE_CMD
fi

if [ ! -z $IMG_LOC ]; then
    # Replace the image location stub in the common header and footer with the desired value
    LINE_TO_REPACE_ESCAPED='https:\/\/psdi-uk.github.io\/psdi-common-style\/img\/'
    ESCAPED_IMG_LOC=$(printf '%s\n' "$IMG_LOC" | sed -e 's/[\/&]/\\&/g')
    REPLACE_CMD_HEAD="sed -i -e 's/$LINE_TO_REPACE_ESCAPED/$ESCAPED_IMG_LOC\//g' $TARGET_DIR"
    eval $REPLACE_CMD_HEAD/psdi-common-header.html
    eval $REPLACE_CMD_HEAD/psdi-common-footer.html
fi
