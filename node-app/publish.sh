#!/bin/sh

SEMESTER=spring2019
PUBLISH_DIR=/web/courses/cs3214/$SEMESTER

if [ ! -d "$PUBLISH_DIR" ]; then
  mkdir -p $PUBLISH_DIR
fi
cp dist/0.app.bundle.js dist/1.app.bundle.js dist/app.bundle.js dist/index.html dist/styles.css $PUBLISH_DIR

for folder in assets documents exercises images lectures projects; do
  if [ ! -d "$PUBLISH_DIR/$folder" ]; then
    mkdir -p $PUBLISH_DIR/$folder
  fi
  cp -r dist/$folder/* $PUBLISH_DIR/$folder
done
