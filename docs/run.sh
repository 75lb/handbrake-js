#!/usr/bin/bash

dcdoc io-read --inputs index.js lib/handbrake.js \
  parse --blocks ~/Documents/dcdoc-zone/dcdoc/parse/lib/block/js/plain-symbol.js \
  quick-table \
  combine-content \
  insert-into-template \
    --template docs/readme.template \
    --registry ~/Documents/dcdoc-zone/75lb-templates/index.js \
  body-to-stdout \
  > readme.md
