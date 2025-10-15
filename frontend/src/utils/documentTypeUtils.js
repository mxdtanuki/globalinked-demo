import React from 'react';

export const getDocumentTypeClass = (docType) => {
  switch (docType?.toUpperCase()) {
    case 'MOA':
      return 'document-type-badge document-type-moa';
    case 'MOU':
      return 'document-type-badge document-type-mou';
    default:
      return 'document-type-badge document-type-default';
  }
};

export const renderDocumentTypeBadge = (docType) => {
  return (
    <span className={getDocumentTypeClass(docType)}>
      {docType || '-'}
    </span>
  );
};