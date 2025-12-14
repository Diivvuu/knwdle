import React from 'react';
import CreateRoleModal from './roles/create-role-modal';
import EditRoleModal from './roles/edit-role-modal';
import ConfirmDialog from './confirm/confirm-dialog';
import AddInviteModal from './invites/add-invite-modal';
import CreateMemberModal from './members/create-member-modal';
import EditMemberModal from './members/edit-member-modal';
import CreateOrgAudienceModal from './org-unit/create-org-audience-modal';

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
      {/* org audience */}
      <CreateOrgAudienceModal />
      {/* <CreateMemberModal /> */}
      <EditMemberModal />
    </>
  );
};

export default Modals;
