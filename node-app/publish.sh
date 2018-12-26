#!/bin/sh

SEMESTER=spring2019
PUBLISH_DIR=/web/courses/cs3214/$SEMESTER

if [ ! -d "$PUBLISH_DIR" ]; then
  mkdir -p $PUBLISH_DIR
fi
cp dist/0.app.bundle.js dist/1.app.bundle.js dist/app.bundle.js dist/index.html dist/styles.css $PUBLISH_DIR

if [ ! -d "$PUBLISH_DIR/assets" ]; then
  mkdir -p $PUBLISH_DIR/assets
fi
cp dist/assets/* $PUBLISH_DIR/assets/
