import CreateOrgModal from './org/create-org-modal';

import EditOrgModal from './org/edit-org-modal';
import JoinOrgModal from './org/join-org-modal';
import { TypeToConfirmDialog } from './type-to-confirm-modal';

const Modals = () => {
  return (
    <>
      <CreateOrgModal />
      <JoinOrgModal />
      <EditOrgModal />
      <TypeToConfirmDialog/>
    </>
  );
};

export default Modals;
