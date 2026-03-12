import { expect } from 'chai';
import ROLE_PERMISSIONS, { ROLES, isValidRole } from '@/config/rolePermissions.js';
import PERMISSIONS from '@/config/permissions.js';

describe('ROLE_PERMISSIONS', () => {

  it('should contain all roles', () => {
    expect(ROLES).to.include.members(['partner', 'contentstack', 'admin']);
  });

  it('should validate correct roles', () => {
    expect(isValidRole('admin')).to.be.true;
    expect(isValidRole('partner')).to.be.true;
  });

  it('should reject invalid roles', () => {
    expect(isValidRole('guest')).to.be.false;
  });

  it('admin should inherit contentstack permissions', () => {
    expect(ROLE_PERMISSIONS.admin).to.include.members(
      ROLE_PERMISSIONS.contentstack
    );
  });

  it('contentstack should inherit partner permissions', () => {
    expect(ROLE_PERMISSIONS.contentstack).to.include.members(
      ROLE_PERMISSIONS.partner
    );
  });

  it('partner should have VIEW_CONTENT permission', () => {
    expect(ROLE_PERMISSIONS.partner).to.include(
      PERMISSIONS.VIEW_CONTENT
    );
  });

});