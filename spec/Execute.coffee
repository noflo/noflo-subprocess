noflo = require 'noflo'
chai = require 'chai' unless chai
Execute = require '../components/Execute.coffee'
fs = require 'fs'

describe 'Execute component', ->
  c = null
  command = null
  out = null
  error = null

  before ->
    c = Execute.getComponent()
    command = noflo.internalSocket.createSocket()
    c.inPorts.command.attach command
  beforeEach ->
    out = noflo.internalSocket.createSocket()
    error = noflo.internalSocket.createSocket()
    c.outPorts.out.attach out
    c.outPorts.error.attach error
  afterEach ->
    c.outPorts.out.detach out
    c.outPorts.error.detach error

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

    beforeEach (done) ->
      groups = []
      out.on 'begingroup', (grp) ->
        groups.push grp
      out.on "data", (data) ->
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
    err = null

    beforeEach (done) ->
      groups = []
      out.on "data", (data) ->
        result = data
        done data
      error.on 'begingroup', (grp) ->
        groups.push grp
      error.on 'data', (data) ->
        err = data
        done()
      command.beginGroup 'send-command'
      command.send cmd

    it 'should return an error', ->
      chai.expect(result).to.not.exist
      chai.expect(err).to.exist
      chai.expect(groups).to.include 'send-command'

  describe 'when command sent do not exist', ->
    groups = []
    result = null
    cmd = 'tar -xvzf foo'
    err = null

    beforeEach (done) ->
      groups = []
      out.on "data", (data) ->
        result = data
        done data
      error.on 'begingroup', (grp) ->
        groups.push grp
      error.on 'data', (data) ->
        err = data
        done()
      command.beginGroup 'send-command'
      command.send cmd

    it 'should return an error', ->
      chai.expect(result).to.not.exist
      chai.expect(err).to.exist
      chai.expect(groups).to.include 'send-command'
