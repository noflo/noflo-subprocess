noflo = require 'noflo'
path = require 'path'
exec = require('child_process').exec

# @runtime noflo-nodejs
# @name Execute

# Safe guard exec command to a max of 1min
execTimeout = 60000

runCmd = (cmd, callback) ->
  options =
    timeout: execTimeout
  exec cmd, options, (err, stdout, stderr) ->
    if err
      if err.signal is 'SIGTERM'
        callback new Error "Command #{cmd} timed out"
      else
        callback err
      return
    else
      callback null, stdout

exports.getComponent = ->
  c = new noflo.Component
  c.icon = 'smile-o'
  c.description = 'Library to execute commands as subprocess'

  c.inPorts.add 'command',
    datatype: 'object'
    description: 'Command to be executed'

  c.outPorts.add 'out',
    datatype: 'object'
    description: 'Output from the input command'
  c.outPorts.add 'error',
    datatype: 'object'
    required: false

  noflo.helpers.WirePattern c,
    in: 'command'
    out: ['out', 'error']
    forwardGroups: true
    async: true
  , (command, groups, outPorts, callback) ->
    runCmd command, (err, val) ->
      if err
        outPorts.error.send err
        do callback
        return
      outPorts.out.send val
      do callback
