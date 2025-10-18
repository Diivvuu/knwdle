import CreateOrgModal from './org/create-org-modal';
import DeleteOrgModal from './org/delete-org-modal';
import EditOrgModal from './org/edit-org-modal';
import JoinOrgModal from './org/join-org-modal';

const Modals = () => {
  return (
    <>
      <CreateOrgModal />
      <JoinOrgModal />
      <EditOrgModal />
      <DeleteOrgModal />
    </>
  );
};

export default Modals;
