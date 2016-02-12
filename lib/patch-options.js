'use strict'
module.exports = patchOptions

/*
 * Some Handbrake switches go like --paramname value, some like --paramname=value or --paramname="value".
 * e.g. --rotate=4 , --deinterlace="slow"
 *
 * See https://trac.handbrake.fr/wiki/CLIGuide - or, better, the CLI Query of the encode log
 * in the GUI version of Handbrake under Tools => Activity log,
 *
 * This code handles this by looking for a "needsEqualsSign" parameter in the cli-options file and replacing the option name to include
 * the value (with the actual value set to an empty string, like this:
 * {
 *    'rotate=4':'',
 *    'deinterlace="slow"' :''
 * }
 *
 * Sometimes quotes are required too: this can be controlled with a "useQuotesAroundValue" parameter, which will default to true for Strings
 * e.g.   { name: 'rotate', type: Number, group: 'filters', needsEqualsSign:true },
 *        { name: 'markers', type: Boolean, alias: 'm', group: 'destination', needsEqualsSign:true, useQuotesAroundValue:true },
 */
function patchOptions (definitions, options) {
  /* clone options object */
  options = Object.keys(options).reduce(function (clone, key) {
    clone[key] = options[key]
    return clone
  }, {})

  definitions.forEach(function(cliOption){
    if (cliOption.needsEqualsSign && cliOption.name !== undefined){
      //only change if set and not set to true (=> bare switch)
      if (options[cliOption.name] && options[cliOption.name] !== true){
        var useQuotesAroundValue = (cliOption.useQuotesAroundValue === true || (cliOption.useQuotesAroundValue === undefined && cliOption.type == String) );
        var quote = useQuotesAroundValue ? '"': '';
        var optionValue = options[cliOption.name];   //this really needs to be escaped for quotes...
        var optionNameEqualsValue = cliOption.name + '=' + quote + optionValue + quote;
        options[optionNameEqualsValue] = '';
        delete options[cliOption.name];   // prevents duplicate option being sent
      }
    }
  });

  return options
}
