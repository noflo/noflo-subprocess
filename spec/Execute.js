/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let chai;
const noflo = require('noflo');

if (!chai) { chai = require('chai'); }
const fs = require('fs');
const Execute = require('../components/Execute.coffee');

describe('Execute component', () => {
  let c = null;
  let command = null;
  let out = null;
  let error = null;

  before(() => {
    c = Execute.getComponent();
    command = noflo.internalSocket.createSocket();
    return c.inPorts.command.attach(command);
  });
  beforeEach(() => {
    out = noflo.internalSocket.createSocket();
    error = noflo.internalSocket.createSocket();
    c.outPorts.out.attach(out);
    return c.outPorts.error.attach(error);
  });
  afterEach(() => {
    c.outPorts.out.detach(out);
    return c.outPorts.error.detach(error);
  });

  describe('when instantiated', () => {
    it('should have input ports', () => chai.expect(c.inPorts.command).to.be.an('object'));
    return it('should have output ports', () => {
      chai.expect(c.outPorts.out).to.be.an('object');
      return chai.expect(c.outPorts.error).to.be.an('object');
    });
  });

  describe('when command sent', () => {
    let groups = [];
    let result = null;
    const cmd = 'ls -lah';

    beforeEach((done) => {
      groups = [];
      out.on('begingroup', (grp) => groups.push(grp));
      out.on('data', (data) => {
        result = data;
        return done();
      });
      error.on('data', (data) => done(data));
      command.beginGroup('send-command');
      return command.send(cmd);
    });

    return it('should return output', () => {
      chai.expect(result).to.exist;
      return chai.expect(groups).to.include('send-command');
    });
  });

  describe('when command sent do not exist', () => {
    let groups = [];
    let result = null;
    const cmd = 'asdasd';
    let err = null;

    beforeEach((done) => {
      groups = [];
      out.on('data', (data) => {
        result = data;
        return done(data);
      });
      error.on('begingroup', (grp) => groups.push(grp));
      error.on('data', (data) => {
        err = data;
        return done();
      });
      command.beginGroup('send-command');
      return command.send(cmd);
    });

    return it('should return an error', () => {
      chai.expect(result).to.not.exist;
      chai.expect(err).to.exist;
      return chai.expect(groups).to.include('send-command');
    });
  });

  return describe('when command sent do not exist', () => {
    let groups = [];
    let result = null;
    const cmd = 'tar -xvzf foo';
    let err = null;

    beforeEach((done) => {
      groups = [];
      out.on('data', (data) => {
        result = data;
        return done(data);
      });
      error.on('begingroup', (grp) => groups.push(grp));
      error.on('data', (data) => {
        err = data;
        return done();
      });
      command.beginGroup('send-command');
      return command.send(cmd);
    });

    return it('should return an error', () => {
      chai.expect(result).to.not.exist;
      chai.expect(err).to.exist;
      return chai.expect(groups).to.include('send-command');
    });
  });
});
