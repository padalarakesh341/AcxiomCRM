const AuditRepository = require('../../data-access/auditRepository');
const UserRepository = require('../../data-access/userRepository');

class AuditWebController {
  static list(req, res, next) {
    try {
      const {
        userId = '',
        module = '',
        action = '',
        result = '',
        startDate = '',
        endDate = '',
        page = 1
      } = req.query;

      const limit = 20;
      const offset = (parseInt(page, 10) - 1) * limit;

      const logs = AuditRepository.findAll({
        userId: userId ? parseInt(userId, 10) : null,
        module,
        action,
        result,
        startDate,
        endDate,
        limit,
        offset
      });

      const total = AuditRepository.countAll({
        userId: userId ? parseInt(userId, 10) : null,
        module,
        action,
        result,
        startDate,
        endDate
      });

      const users = UserRepository.findAll();

      return res.render('audit/index', {
        title: 'Security & Activity Audit Trail',
        currentUser: req.session.user,
        logs,
        users,
        pagination: {
          page: parseInt(page, 10),
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1
        },
        filters: { userId, module, action, result, startDate, endDate },
        error: req.flash('error'),
        success: req.flash('success')
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuditWebController;
