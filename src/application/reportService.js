const { stringify } = require('csv-stringify/sync');
const ReportRepository = require('../data-access/reportRepository');
const AuditService = require('../cross-cutting/auditService');

class ReportService {
  static getCustomerReport(filters = {}) {
    return ReportRepository.getCustomerReport(filters);
  }

  static exportCustomerReportCsv(filters = {}, currentUser, ipAddress = '127.0.0.1') {
    const data = this.getCustomerReport(filters);
    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Customer Name' },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone' },
      { key: 'company', header: 'Company' },
      { key: 'status', header: 'Status' },
      { key: 'owner_name', header: 'Assigned Executive' },
      { key: 'created_at', header: 'Created Date' }
    ];

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role_name || currentUser.role,
      action: 'REPORT_EXPORTED',
      module: 'REPORT',
      details: 'Exported Customer Report to CSV',
      ipAddress
    });

    return stringify(data, { header: true, columns });
  }

  static getLeadReport(filters = {}) {
    return ReportRepository.getLeadReport(filters);
  }

  static exportLeadReportCsv(filters = {}, currentUser, ipAddress = '127.0.0.1') {
    const data = this.getLeadReport(filters);
    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'title', header: 'Title' },
      { key: 'contact_person', header: 'Contact Person' },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone' },
      { key: 'company', header: 'Company' },
      { key: 'source', header: 'Source' },
      { key: 'status', header: 'Status' },
      { key: 'priority', header: 'Priority' },
      { key: 'assigned_to_name', header: 'Assigned Executive' },
      { key: 'converted_customer_name', header: 'Converted Customer' },
      { key: 'created_at', header: 'Created Date' }
    ];

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role_name || currentUser.role,
      action: 'REPORT_EXPORTED',
      module: 'REPORT',
      details: 'Exported Lead Report to CSV',
      ipAddress
    });

    return stringify(data, { header: true, columns });
  }

  static getFollowUpReport(filters = {}) {
    return ReportRepository.getFollowUpReport(filters);
  }

  static exportFollowUpReportCsv(filters = {}, currentUser, ipAddress = '127.0.0.1') {
    const data = this.getFollowUpReport(filters);
    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'subject', header: 'Subject' },
      { key: 'entity_type', header: 'Entity Type' },
      { key: 'entity_id', header: 'Entity ID' },
      { key: 'type', header: 'Type' },
      { key: 'status', header: 'Status' },
      { key: 'follow_up_date', header: 'Follow-up Date' },
      { key: 'assigned_to_name', header: 'Assigned User' },
      { key: 'completed_at', header: 'Completed At' }
    ];

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role_name || currentUser.role,
      action: 'REPORT_EXPORTED',
      module: 'REPORT',
      details: 'Exported Follow-Up Report to CSV',
      ipAddress
    });

    return stringify(data, { header: true, columns });
  }

  static getOpportunityReport(filters = {}) {
    return ReportRepository.getOpportunityReport(filters);
  }

  static exportOpportunityReportCsv(filters = {}, currentUser, ipAddress = '127.0.0.1') {
    const data = this.getOpportunityReport(filters);
    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Opportunity Name' },
      { key: 'customer_name', header: 'Customer' },
      { key: 'owner_name', header: 'Owner' },
      { key: 'stage', header: 'Stage' },
      { key: 'amount', header: 'Amount ($)' },
      { key: 'probability', header: 'Probability (%)' },
      { key: 'weighted_amount', header: 'Weighted Amount ($)' },
      { key: 'expected_close_date', header: 'Expected Close Date' }
    ];

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role_name || currentUser.role,
      action: 'REPORT_EXPORTED',
      module: 'REPORT',
      details: 'Exported Opportunity Report to CSV',
      ipAddress
    });

    return stringify(data, { header: true, columns });
  }

  static getPipelineReport() {
    return ReportRepository.getPipelineReport();
  }

  static getConversionReport() {
    return ReportRepository.getConversionReport();
  }

  static getUserActivityReport() {
    return ReportRepository.getUserActivityReport();
  }

  static getAuditReport(filters = {}) {
    return ReportRepository.getAuditReport(filters);
  }

  static exportAuditReportCsv(filters = {}, currentUser, ipAddress = '127.0.0.1') {
    const data = this.getAuditReport(filters);
    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'created_at', header: 'Timestamp' },
      { key: 'username', header: 'User' },
      { key: 'role', header: 'Role' },
      { key: 'module', header: 'Module' },
      { key: 'action', header: 'Action' },
      { key: 'record_id', header: 'Record ID' },
      { key: 'result', header: 'Result' },
      { key: 'ip_address', header: 'IP Address' },
      { key: 'details', header: 'Details' }
    ];

    AuditService.log({
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role_name || currentUser.role,
      action: 'REPORT_EXPORTED',
      module: 'REPORT',
      details: 'Exported Audit Report to CSV',
      ipAddress
    });

    return stringify(data, { header: true, columns });
  }
}

module.exports = ReportService;
