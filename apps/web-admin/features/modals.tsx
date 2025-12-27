import React from 'react';
import CreateRoleModal from './roles/create-role-modal';
import EditRoleModal from './roles/edit-role-modal';
import ConfirmDialog from './confirm/confirm-dialog';
import AddInviteModal from './invites/add-invite-modal';
import CreateMemberModal from './members/create-member-modal';
import EditMemberModal from './members/edit-member-modal';
import CreateAudienceModal from './audience/create-audience-modal';
import EditAudienceModal from './audience/edit-audience-modal';
import AddAudienceMemberModal from './audience-member/add-audience.member-modal';
// import CreateOrgAudienceModal from './org-audience/create-org-audience-modal';

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
      {/* <CreateOrgAudienceModal /> */}
      {/* <CreateMemberModal /> */}
      <EditMemberModal />
      <CreateAudienceModal />
      <EditAudienceModal />
      <AddAudienceMemberModal/>
    </>
  );
};

export default Modals;
