/***************************************************************************
Author   : Joey Mazzarelli
Email    : mazzarelli@gmail.com
Homepage : http://joey.mazzarelli.com
Source   : http://bitbucket.org/mazzarell/js-opts/
License  : Simplified BSD License
Version  : 1.0

Copyright 2010 Joey Mazzarelli. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY JOEY MAZZARELLI 'AS IS' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
EVENT SHALL JOEY MAZZARELLI OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies,
either expressed or implied, of Joey Mazzarelli.
***************************************************************************/

var print       = require('sys').puts
  , values      = {}
  , args        = []
  , errors      = []
  , descriptors = [];


/**
 * Parse the command line options
 * @param array options Options to parse
 *
 * Each option in the array can have the following fields. None are required, 
 * but you should at least provide a short or long name.
 *   {
 *     short       : 'l',
 *     long        : 'list',
 *     description : 'Show a list',
 *     value       : false,
 *     required    : true,
 *     callback    : function (value) { ... }
 *   }
 *
 * You can add an automatically generated help message by passing
 * a second parameter of <true> or by including the option;
 *   {
 *     long        : 'help',
 *     description : 'Show this help message',
 *     callback    : require('./opts').help,
 *   }
 */
exports.parse = function (options, help) {

  if (help) {
    options.push({ long        : 'help'
                 , description : 'Show this help message'
                 , callback    : exports.help
                 });
  }
  descriptors = options;

  var opts = {};
  for (var i=0; i<options.length; i++) {
    if (options[i].short) {
      if (!opts['-' + options[i].short]) {
        opts['-' + options[i].short] = options[i];
      } else {
        print('Conflicting flags: -' + options[i].short);
        process.exit(1);
      }
    }
    if (options[i].long) {
      if (!opts['--' + options[i].long]) {
        opts['--' + options[i].long] = options[i];
      } else {
        print('Conflicting flags: --' + options[i].long);
        process.exit(1);
      }
    }
  }

  for (var i=2; i<process.argv.length; i++) {
    var inp = process.argv[i];
    if (opts[inp]) {
      // found a match, process it.
      var opt = opts[inp];
      if (!opt.value) {
        if (opt.callback) opt.callback(true);
        if (opt.short) values[opt.short] = true;
        if (opt.long) values[opt.long] = true;
      } else {
        var next = process.argv[i+1];
        if (!next || opts[next]) {
          var flag = opt.short || opt.long;
          errors.push('Missing value for argument: ' + flag);
          if (opt.short) values[opt.short] = true;
          if (opt.long) values[opt.long] = true;
        } else {
          if (opt.callback) opt.callback(next);
          if (opt.short) values[opt.short] = next;
          if (opt.long) values[opt.long] = next;
          i++;
        }
      }
    } else {
      // No match. If it starts with a dash, show an error. Otherwise
      // add it to the extra args.
      if (inp[0] == '-') {
        print('Unknown option: ' + inp);
        if (opts['--help']) print('Try --help');
        process.exit(1);
      } else {
        args.push(inp);
      }
    }
  }
  for (var i=0; i<options.length; i++) {
    var flag = options[i].short || options[i].long;
    if (options[i].required && !exports.get(flag)) {
      errors.push('Missing required argument: ' + flag);
    }
  }
  if (errors.length) {
    for (var i=0; i<errors.length; i++) print(errors[i]);
    process.exit(1);
  }
};

/**
 * Get the value of an option. Can be the short or long option
 * @return string
 */
exports.get = function (opt) {
  return values[opt] || values['-' + opt] || values['--' + opt];
};

/**
 * Get unknown args. Could have special meaning to client
 */
exports.args = function () {
  return args;
};

exports.help = function () {
  for (var i=0; i<descriptors.length; i++) {
    var opt = descriptors[i];
    var line;
    if (opt.description) print(opt.description);
    if (opt.short && !opt.long) line = '-' + opt.short;
    else if (opt.long && !opt.short) line = '--' + opt.long;
    else line = '-' + opt.short + ', --' + opt.long;
    if (opt.value) line += ' <value>';
    if (opt.required) line += ' (required)';
    print('    ' + line);
  }
  process.exit(1);
};

