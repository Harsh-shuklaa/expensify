import React from 'react';

const DeleteAlert = ({ content, onDelete }) => {
  return (
    <div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-700 dark:text-gray-300 ">{content}</p>
        <button
          type="button"
          className="add-btn add-btn-fill dark:text-white"
          onClick={onDelete}
          autoFocus
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteAlert;
