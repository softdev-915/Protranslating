/* eslint-disable no-unused-expressions,class-methods-use-this*/
/* global describe, it, before, beforeEach, after, afterEach */
const chai = require('chai');
require('mocha');

const expect = chai.expect;

const validateEmailNotification = require('../../../../../../app/components/scheduler/notifications/email/validation');

describe('Email notification validation', () => {
  it('should invalidate invalid types or empty object', () => {
    expect(validateEmailNotification({})).to.exist;
    expect(validateEmailNotification(() => {})).to.exist;
    expect(validateEmailNotification('')).to.exist;
    expect(validateEmailNotification(null)).to.exist;
    expect(validateEmailNotification(undefined)).to.exist;
    expect(validateEmailNotification()).to.exist;
    expect(validateEmailNotification(1)).to.exist;
    expect(validateEmailNotification(NaN)).to.exist;
  });

  it('should invalidate empty email', () => {
    expect(validateEmailNotification({
      email: {},
    })).to.exist;
  });

  it('should invalidate empty subject', () => {
    expect(validateEmailNotification({
      email: {
        subject: '',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' }],
        content: {
          mime: 'text/plain',
          data: 'Test text',
        },
      },
    })).to.exist;
  });

  it('should invalidate empty to', () => {
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        content: {
          mime: 'text/plain',
          data: 'Test text',
        },
      },
    })).to.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: '',
        content: {
          mime: 'text/plain',
          data: 'Test text',
        },
      },
    })).to.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [],
        content: {
          mime: 'text/plain',
          data: 'Test text',
        },
      },
    })).to.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: {},
        content: {
          mime: 'text/plain',
          data: 'Test text',
        },
      },
    })).to.exist;
  });

  it('should invalidate empty to without email', () => {
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last' }],
        content: {
          mime: 'text/plain',
          data: 'Test text',
        },
      },
    })).to.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last', email: '' }],
        content: {
          mime: 'text/plain',
          data: 'Test text',
        },
      },
    })).to.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' },
          { firstName: 'First', lastName: 'Last', email: '' }],
        content: {
          mime: 'text/plain',
          data: 'Test text',
        },
      },
    })).to.exist;
  });


  it('should invalidate content with no mime or data', () => {
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' }],
        content: [{
          data: '',
        }],
      },
    })).to.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' }],
        content: [{
          mime: '',
          data: '',
        }],
      },
    })).to.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' }],
        content: [{
          mime: 'text/plain',
        }],
      },
    })).to.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' }],
        content: [{
          data: 'text/plain',
        }],
      },
    })).to.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' }],
        content: [{
          mime: 'text/plain',
          data: 'data',
        },
        {
          data: 'data',
        }],
      },
    })).to.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' }],
        content: [{
          mime: 'text/plain',
          data: '',
        }],
      },
    })).to.exist;
  });

  it('should not fail to validate proper email notification', () => {
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' }],
        content: [{
          mime: 'text/plain',
          data: 'asd',
        }],
      },
    })).to.not.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' }],
        content: [{
          mime: 'text/plain',
          data: 'asd',
        }],
      },
    })).to.not.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ email: 'test@protranslating.com' }],
        content: [{
          mime: 'text/plain',
          data: 'asd',
        }],
      },
    })).to.not.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ email: 'test@protranslating.com' }],
        content: {
          mime: 'text/plain',
          data: 'asd',
        },
      },
    })).to.not.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: 'test@protranslating.com',
        to: [{ email: 'test@protranslating.com' }],
        content: [{
          mime: 'text/plain',
          data: 'asd',
        },
        {
          mime: 'text/html',
          data: 'lala land',
        }],
      },
    })).to.not.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        from: '',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' }],
        content: {
          mime: 'text/plain',
          data: 'Test text',
        },
      },
    })).to.not.exist;
    expect(validateEmailNotification({
      email: {
        subject: 'Test subject',
        to: [{ firstName: 'First', lastName: 'Last', email: 'test@protranslating.com' }],
        content: {
          mime: 'text/plain',
          data: 'Test text',
        },
      },
    })).to.not.exist;
  });
});
