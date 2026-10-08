const ReportService = require('../../application/reportService');
const AuditService = require('../../cross-cutting/auditService');

class ReportApiController {
  static pipeline(req, res, next) {
    try {
      const summary = ReportService.getPipelineReport();
      return res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  static conversion(req, res, next) {
    try {
      const conversion = ReportService.getConversionReport();
      return res.status(200).json({ success: true, data: conversion });
    } catch (err) {
      next(err);
    }
  }

  static userActivity(req, res, next) {
    try {
      const activity = ReportService.getUserActivityReport();
      return res.status(200).json({ success: true, data: activity });
    } catch (err) {
      next(err);
    }
  }

  static exportCsv(req, res, next) {
    try {
      const { type } = req.params;
      const ipAddress = AuditService.getClientIp(req);
      let csvContent = '';
      let filename = `export_${type}_${Date.now()}.csv`;

      switch (type) {
        case 'customers':
          csvContent = ReportService.exportCustomerReportCsv(req.query, req.user, ipAddress);
          break;
        case 'leads':
          csvContent = ReportService.exportLeadReportCsv(req.query, req.user, ipAddress);
          break;
        case 'followups':
          csvContent = ReportService.exportFollowUpReportCsv(req.query, req.user, ipAddress);
          break;
        case 'opportunities':
          csvContent = ReportService.exportOpportunityReportCsv(req.query, req.user, ipAddress);
          break;
        case 'audit':
          csvContent = ReportService.exportAuditReportCsv(req.query, req.user, ipAddress);
          break;
        default:
          return res.status(400).json({ success: false, error: { message: `Unsupported export type: ${type}` } });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReportApiController;
