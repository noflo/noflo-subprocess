noflo = require 'noflo'
chai = require 'chai' unless chai
Execute = require '../components/Execute.coffee'
fs = require 'fs'

describe 'Execute component', ->
  c = null
  command = null
  out = null
  error = null

  beforeEach ->
    c = Execute.getComponent()
    command = noflo.internalSocket.createSocket()
    out = noflo.internalSocket.createSocket()
    error = noflo.internalSocket.createSocket()
    c.inPorts.command.attach command
    c.outPorts.out.attach out
    c.outPorts.error.attach error

  describe 'when instantiated', ->
    it 'should have input ports', ->
      chai.expect(c.inPorts.command).to.be.an 'object'
    it 'should have output ports', ->
      chai.expect(c.outPorts.out).to.be.an 'object'
      chai.expect(c.outPorts.error).to.be.an 'object'

  describe 'when command sent', ->
    groups = []
    result = null
    cmd = 'ls -lah'

    before (done) ->
      groups = []
      out.on 'begingroup', (grp) ->
        groups.push grp
      out.once "data", (data) ->
        result = data
        done()
      error.on 'data', (data) ->
        done data
      command.beginGroup 'send-command'
      command.send cmd

    it 'should return output', ->
      chai.expect(result).to.exist
      chai.expect(groups).to.include 'send-command'

  describe 'when command sent do not exist', ->
    groups = []
    result = null
    cmd = 'asdasd'

    before (done) ->
      groups = []
      out.on 'begingroup', (grp) ->
        groups.push grp
      out.once "data", (data) ->
        result = data
        done data
      error.on 'data', (data) ->
        done()
      command.beginGroup 'send-command'
      command.send cmd

    it 'should return an error', ->
      chai.expect(result).to.not.exist
      chai.expect(error).to.exist
      chai.expect(groups).to.include 'send-command'

  describe 'when command sent do not exist', ->
    groups = []
    result = null
    cmd = 'tar -xvzf foo'

    before (done) ->
      groups = []
      out.on 'begingroup', (grp) ->
        groups.push grp
      out.once "data", (data) ->
        result = data
        done data
      error.on 'data', (data) ->
        done()
      command.beginGroup 'send-command'
      command.send cmd

    it 'should return an error', ->
      chai.expect(result).to.not.exist
      chai.expect(error).to.exist
      chai.expect(groups).to.include 'send-command'
