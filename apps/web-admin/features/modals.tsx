import React from 'react';
import CreateRoleModal from './roles/create-role-modal';
import EditRoleModal from './roles/edit-role-modal';
import ConfirmDialog from './confirm/confirm-dialog';
import AddInviteModal from './invites/add-invite-modal';
import CreateOrgUnitModal from './org-unit/create-org-unit-modal';

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
    </>
  );
};

export default Modals;
