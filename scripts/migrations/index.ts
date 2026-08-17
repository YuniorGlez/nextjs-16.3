import initial from "./0001_initial";
import drafts from "./0002_page_drafts";
import rbac from "./0003_rbac";
import auditLog from "./0004_audit_log";
import mediaLibrary from "./0005_media_library";
import sectorTemplates from "./0006_sector_templates";
import i18n from "./0007_i18n";

export const migrations = [initial, drafts, rbac, auditLog, mediaLibrary, sectorTemplates, i18n];
