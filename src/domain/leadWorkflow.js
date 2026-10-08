/**
 * Lead Workflow and State Transition Rules
 */

const LEAD_STATUSES = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  UNQUALIFIED: 'Unqualified',
  CONVERTED: 'Converted',
  LOST: 'Lost'
};

const ALLOWED_TRANSITIONS = {
  [LEAD_STATUSES.NEW]: [LEAD_STATUSES.CONTACTED, LEAD_STATUSES.UNQUALIFIED, LEAD_STATUSES.LOST],
  [LEAD_STATUSES.CONTACTED]: [LEAD_STATUSES.QUALIFIED, LEAD_STATUSES.UNQUALIFIED, LEAD_STATUSES.LOST],
  [LEAD_STATUSES.QUALIFIED]: [LEAD_STATUSES.CONVERTED, LEAD_STATUSES.LOST],
  [LEAD_STATUSES.UNQUALIFIED]: [LEAD_STATUSES.CONTACTED], // Reopening
  [LEAD_STATUSES.LOST]: [LEAD_STATUSES.CONTACTED],        // Reopening
  [LEAD_STATUSES.CONVERTED]: []                          // Terminal state
};

function canTransitionLead(currentStatus, targetStatus) {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (allowed.includes(targetStatus)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Invalid lead status transition from "${currentStatus}" to "${targetStatus}". Allowed next statuses: [${allowed.join(', ') || 'None (Terminal state)'}].`
  };
}

function canConvertLead(lead) {
  if (!lead) {
    return { allowed: false, reason: 'Lead not found.' };
  }

  if (lead.status === LEAD_STATUSES.CONVERTED) {
    return { allowed: false, reason: 'This lead has already been converted.' };
  }

  if (lead.status !== LEAD_STATUSES.QUALIFIED) {
    return { allowed: false, reason: `Only Qualified leads can be converted. Current status is "${lead.status}".` };
  }

  return { allowed: true };
}

module.exports = {
  LEAD_STATUSES,
  ALLOWED_TRANSITIONS,
  canTransitionLead,
  canConvertLead
};
