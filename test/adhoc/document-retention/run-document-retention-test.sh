#!/bin/bash
DIR=$(pwd)

rm -rf $DIR/data/*

$DIR/../../../node_modules/.bin/mocha --no-timeouts $DIR/drp-test.js
