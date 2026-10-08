const ReportService = require('../../application/reportService');
const UserRepository = require('../../data-access/userRepository');
const AuditService = require('../../cross-cutting/auditService');

class ReportWebController {
  static index(req, res) {
    const reportType = req.query.type || 'customers';
    const executives = UserRepository.getSalesExecutives();
    const users = UserRepository.findAll();

    let reportData = null;
    const filters = req.query;

    switch (reportType) {
      case 'customers':
        reportData = ReportService.getCustomerReport(filters);
        break;
      case 'leads':
        reportData = ReportService.getLeadReport(filters);
        break;
      case 'followups':
        reportData = ReportService.getFollowUpReport(filters);
        break;
      case 'opportunities':
        reportData = ReportService.getOpportunityReport(filters);
        break;
      case 'pipeline':
        reportData = ReportService.getPipelineReport();
        break;
      case 'conversion':
        reportData = ReportService.getConversionReport();
        break;
      case 'user-activity':
        reportData = ReportService.getUserActivityReport();
        break;
      case 'audit':
        reportData = ReportService.getAuditReport(filters);
        break;
      default:
        reportData = [];
    }

    return res.render('reports/index', {
      title: 'CRM Business Reports',
      currentUser: req.session.user,
      reportType,
      reportData,
      filters,
      executives,
      users,
      error: req.flash('error'),
      success: req.flash('success')
    });
  }

  static exportCsv(req, res, next) {
    try {
      const { type } = req.params;
      const ipAddress = AuditService.getClientIp(req);
      let csvContent = '';
      let filename = `AcxiomCRM_${type}_${Date.now()}.csv`;

      switch (type) {
        case 'customers':
          csvContent = ReportService.exportCustomerReportCsv(req.query, req.session.user, ipAddress);
          break;
        case 'leads':
          csvContent = ReportService.exportLeadReportCsv(req.query, req.session.user, ipAddress);
          break;
        case 'followups':
          csvContent = ReportService.exportFollowUpReportCsv(req.query, req.session.user, ipAddress);
          break;
        case 'opportunities':
          csvContent = ReportService.exportOpportunityReportCsv(req.query, req.session.user, ipAddress);
          break;
        case 'audit':
          csvContent = ReportService.exportAuditReportCsv(req.query, req.session.user, ipAddress);
          break;
        default:
          req.flash('error', `Unsupported export type: ${type}`);
          return res.redirect('/reports');
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReportWebController;
