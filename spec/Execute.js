const noflo = require('noflo');
const chai = require('chai');

describe('Execute component', () => {
  let c = null;
  let command = null;
  let out = null;
  let error = null;

  before(() => {
    const loader = new noflo.ComponentLoader(process.cwd());
    return loader.load('subprocess/Execute')
      .then((instance) => {
        c = instance;
        command = noflo.internalSocket.createSocket();
        c.inPorts.command.attach(command);
      });
  });
  beforeEach(() => {
    out = noflo.internalSocket.createSocket();
    error = noflo.internalSocket.createSocket();
    c.outPorts.out.attach(out);
    c.outPorts.error.attach(error);
  });
  afterEach(() => {
    c.outPorts.out.detach(out);
    c.outPorts.error.detach(error);
  });

  describe('when instantiated', () => {
    it('should have input ports', () => chai.expect(c.inPorts.command).to.be.an('object'));
    it('should have output ports', () => {
      chai.expect(c.outPorts.out).to.be.an('object');
      chai.expect(c.outPorts.error).to.be.an('object');
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
        done();
      });
      error.on('data', (data) => done(data));
      command.beginGroup('send-command');
      command.send(cmd);
    });

    it('should return output', () => {
      chai.expect(result).to.not.equal(null);
      chai.expect(groups).to.include('send-command');
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
        done(data);
      });
      error.on('begingroup', (grp) => groups.push(grp));
      error.on('data', (data) => {
        err = data;
        done();
      });
      command.beginGroup('send-command');
      command.send(cmd);
    });

    it('should return an error', () => {
      chai.expect(result).to.equal(null);
      chai.expect(err).to.be.an('error');
      chai.expect(groups).to.include('send-command');
    });
  });

  describe('when command sent do not exist', () => {
    let groups = [];
    let result = null;
    const cmd = 'tar -xvzf foo';
    let err = null;

    beforeEach((done) => {
      groups = [];
      out.on('data', (data) => {
        result = data;
        done(data);
      });
      error.on('begingroup', (grp) => groups.push(grp));
      error.on('data', (data) => {
        err = data;
        done();
      });
      command.beginGroup('send-command');
      command.send(cmd);
    });

    it('should return an error', () => {
      chai.expect(result).to.equal(null);
      chai.expect(err).to.be.an('error');
      chai.expect(groups).to.include('send-command');
    });
  });
});
