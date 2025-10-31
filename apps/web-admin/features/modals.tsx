import React from 'react';
import CreateRoleModal from './roles/create-role-modal';
import EditRoleModal from './roles/edit-role-modal';
import ConfirmDialog from './confirm/confirm-dialog';
import AddInviteModal from './invites/add-invite-modal';
import CreateOrgUnitModal from './org-unit/create-org-unit-modal';
import CreateMemberModal from './members/create-member-modal';
import EditMemberModal from './members/edit-member-modal';

const Modals = () => {
  return (
    <>
      {/* confirm modal */}
      <ConfirmDialog />
      {/* role modals */}
      <CreateRoleModal />
      <EditRoleModal />
      {/* invite modals */}
      <AddInviteModal />
      {/* org unit */}
      <CreateOrgUnitModal />
      {/* <CreateMemberModal /> */}
      <EditMemberModal />
    </>
  );
};

export default Modals;
