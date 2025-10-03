'use client';

import React from 'react';
import CommonDialog from './CommonDialog';

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName?: string;
  isLoading?: boolean;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  isLoading = false,
}) => {
  const getMessage = () => {
    if (itemName) {
      return `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;
    }
    return 'Are you sure you want to delete this item? This action cannot be undone.';
  };

  return (
    <CommonDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={getMessage()}
      confirmText="Delete"
      cancelText="Cancel"
      type="delete"
      isLoading={isLoading}
    />
  );
};

export default DeleteDialog;
