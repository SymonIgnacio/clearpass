import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';

const RejectionModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Reject Request',
  message = 'Please provide a reason for this rejection:',
  inputLabel = 'Rejection Reason',
  confirmText = 'Reject',
}) => {
  return (
    <ConfirmationModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      confirmText={confirmText}
      type="error"
      showInput={true}
      inputLabel={inputLabel}
      inputPlaceholder="Enter reason..."
      inputRequired={true}
    />
  );
};

export default RejectionModal;
