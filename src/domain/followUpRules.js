/**
 * Follow-Up Business Rules
 */

const FOLLOW_UP_TYPES = ['Call', 'Email', 'Meeting', 'Demo', 'Task'];
const FOLLOW_UP_STATUSES = ['Planned', 'Completed', 'Missed', 'Cancelled'];

function validateNewFollowUp({ subject, followUpDate, type, assignedUserId }) {
  const errors = [];

  if (!subject || subject.trim().length === 0) {
    errors.push('Follow-up subject is required.');
  }

  if (!followUpDate) {
    errors.push('Follow-up date is required.');
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateObj = new Date(followUpDate);
    dateObj.setHours(0, 0, 0, 0);

    if (dateObj < today) {
      errors.push('Follow-up date cannot be earlier than today.');
    }
  }

  if (type && !FOLLOW_UP_TYPES.includes(type)) {
    errors.push(`Invalid follow-up type. Allowed types: ${FOLLOW_UP_TYPES.join(', ')}.`);
  }

  if (!assignedUserId) {
    errors.push('Assigned user is required.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  FOLLOW_UP_TYPES,
  FOLLOW_UP_STATUSES,
  validateNewFollowUp
};
