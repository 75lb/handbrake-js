#!/usr/bin/bash

dcdoc io-read --inputs index.js lib/handbrake.js \
  parse --block-spec ~/Documents/dcdoc-zone/dcdoc/parse/lib/matcher/block/js/plain.js ~/Documents/dcdoc-zone/dcdoc/parse/lib/block/text-data-symbol.js \
  combine-content \
  insert-into-template \
    --template docs/readme.template \
    --registry ~/Documents/dcdoc-zone/75lb-templates/index.js \
  body-to-stdout \
  > readme.md
