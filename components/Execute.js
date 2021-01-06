/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const noflo = require('noflo');
const path = require('path');
const {
  exec,
} = require('child_process');

// @runtime noflo-nodejs
// @name Execute

// Safe guard exec command to a max of 1min
const execTimeout = 60000;

const runCmd = function (cmd, callback) {
  const options = { timeout: execTimeout };
  return exec(cmd, options, (err, stdout, stderr) => {
    if (err) {
      if (err.signal === 'SIGTERM') {
        callback(new Error(`Command ${cmd} timed out`));
      } else {
        callback(err);
      }
    } else {
      return callback(null, stdout);
    }
  });
};

exports.getComponent = function () {
  const c = new noflo.Component();
  c.icon = 'smile-o';
  c.description = 'Library to execute commands as subprocess';

  c.inPorts.add('command', {
    datatype: 'object',
    description: 'Command to be executed',
  });

  c.outPorts.add('out', {
    datatype: 'object',
    description: 'Output from the input command',
  });
  c.outPorts.add('error', {
    datatype: 'object',
    required: false,
  });

  return noflo.helpers.WirePattern(c, {
    in: 'command',
    out: 'out',
    forwardGroups: true,
    async: true,
  },
  (command, groups, out, callback) => {
    runCmd(command, (err, val) => {
      if (err) { return callback(err); }
      out.send(val);
      return callback();
    });
  });
};
