import { ADMIN_AUDIT_LOGS } from '../adminDummyData';

export async function fetchAuditLogs() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return ADMIN_AUDIT_LOGS;
}

export async function getAuditLogsByUser(userId) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return ADMIN_AUDIT_LOGS.filter(log => log.user_id === userId);
}

export async function getAuditLogsByEntity(entityType, entityId) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return ADMIN_AUDIT_LOGS.filter(log => 
    log.entity_type === entityType && log.entity_id === entityId
  );
}

