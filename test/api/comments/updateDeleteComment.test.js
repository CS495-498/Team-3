import { expect } from 'chai';
import sinon from 'sinon';
import { hasPermission } from '../../../src/utils/hasPermission.js';

// Inline helpers to mimic frontend comment logic
function canEditComment(currentUserId, comment, role) {
  return currentUserId === comment.user_id || hasPermission(role, 'manage_all_comments');
}

function canDeleteComment(currentUserId, comment, role) {
  return currentUserId === comment.user_id || hasPermission(role, 'manage_all_comments');
}

describe('Comment Permissions', () => {
  describe('Editing comments', () => {
    it('allows authors to edit their own comment', () => {
      const result = canEditComment('user-1', { user_id: 'user-1' }, 'partner');
      expect(result).to.be.true;
    });

    it('allows admin to edit any comment', () => {
      const result = canEditComment('user-2', { user_id: 'user-1' }, 'admin');
      expect(result).to.be.true;
    });

    it('prevents non-author, non-admin from editing', () => {
      const result = canEditComment('user-2', { user_id: 'user-1' }, 'partner');
      expect(result).to.be.false;
    });
  });

  describe('Deleting comments', () => {
    it('allows authors to delete their own comment', () => {
      const result = canDeleteComment('user-1', { user_id: 'user-1' }, 'partner');
      expect(result).to.be.true;
    });

    it('allows admin to delete any comment', () => {
      const result = canDeleteComment('user-2', { user_id: 'user-1' }, 'admin');
      expect(result).to.be.true;
    });

    it('prevents non-author, non-admin from deleting', () => {
      const result = canDeleteComment('user-2', { user_id: 'user-1' }, 'partner');
      expect(result).to.be.false;
    });
  });
});
