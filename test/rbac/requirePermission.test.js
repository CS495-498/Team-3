import { expect } from 'chai';
import sinon from 'sinon';
import * as nextServer from 'next/server.js';

import requirePermission from '@/utils/auth/requirePermission.js';
import ROLE_PERMISSIONS from '@/config/rolePermissions.js';
import PERMISSIONS from '@/config/permissions.js';

describe('requirePermission', () => {

  let jsonStub;

  beforeEach(() => {
    jsonStub = sinon.stub(nextServer.NextResponse, 'json');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return null if role has permission', () => {
    const result = requirePermission(
      'admin',
      PERMISSIONS.MANAGE_USERS
    );

    expect(result).to.be.null;
    expect(jsonStub.called).to.be.false;
  });

  it('should return 403 response if role lacks permission', () => {
    const fakeResponse = { status: 403 };
    jsonStub.returns(fakeResponse);

    const result = requirePermission(
      'partner',
      PERMISSIONS.MANAGE_USERS
    );

    expect(jsonStub.calledOnce).to.be.true;
    expect(result).to.equal(fakeResponse);

    const [body, options] = jsonStub.firstCall.args;

    expect(body).to.deep.equal({
      error: "Forbidden: insufficient permissions"
    });

    expect(options).to.deep.equal({ status: 403 });
  });

  it('should return 403 if role does not exist', () => {
    jsonStub.returns({ status: 403 });

    const result = requirePermission(
      'invalidRole',
      PERMISSIONS.VIEW_CONTENT
    );

    expect(jsonStub.calledOnce).to.be.true;
    expect(result.status).to.equal(403);
  });

});