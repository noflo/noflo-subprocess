const noflo = require('noflo');
const {
  exec,
} = require('child_process');

// @runtime noflo-nodejs
// @name Execute

// Safe guard exec command to a max of 1min
const execTimeout = 60000;

function runCmd(cmd, callback) {
  const options = { timeout: execTimeout };
  exec(cmd, options, (err, stdout) => {
    if (err) {
      if (err.signal === 'SIGTERM') {
        callback(new Error(`Command ${cmd} timed out`));
      } else {
        callback(err);
      }
    } else {
      callback(null, stdout);
    }
  });
}

exports.getComponent = () => {
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
  c.forwardBrackets = {
    command: ['out', 'error'],
  };

  return c.process((input, output) => {
    if (!input.hasData('command')) {
      return;
    }
    const command = input.getData('command');
    runCmd(command, (err, val) => {
      if (err) {
        output.done(err);
        return;
      }
      output.sendDone({
        out: val,
      });
    });
  });
};
