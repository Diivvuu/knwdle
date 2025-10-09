import React from 'react';
import CreateRoleModal from './roles/create-role-modal';
import EditRoleModal from './roles/edit-role-modal';
import ConfirmDialog from './confirm/confirm-dialog';
import AddInviteModal from './invites/add-invite-modal';

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
    </>
  );
};

export default Modals;
