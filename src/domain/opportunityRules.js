/**
 * Opportunity Business Rules & Pipeline Calculations
 */

const OPPORTUNITY_STAGES = {
  QUALIFICATION: 'Qualification',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost'
};

const ACTIVE_STAGES = [
  OPPORTUNITY_STAGES.QUALIFICATION,
  OPPORTUNITY_STAGES.PROPOSAL,
  OPPORTUNITY_STAGES.NEGOTIATION
];

function calculateWeightedAmount(amount, probability) {
  const parsedAmount = parseFloat(amount) || 0;
  const parsedProb = parseFloat(probability) || 0;
  return Math.round((parsedAmount * parsedProb / 100) * 100) / 100;
}

function validateOpportunity({ stage, amount, probability, expectedCloseDate }) {
  const errors = [];

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    errors.push('Opportunity amount must be greater than zero.');
  }

  const parsedProb = parseInt(probability, 10);
  if (isNaN(parsedProb) || parsedProb < 0 || parsedProb > 100) {
    errors.push('Probability must be an integer between 0 and 100.');
  }

  const validStages = Object.values(OPPORTUNITY_STAGES);
  if (!stage || !validStages.includes(stage)) {
    errors.push(`Invalid stage. Must be one of: ${validStages.join(', ')}.`);
  }

  if (!expectedCloseDate) {
    errors.push('Expected close date is required.');
  } else if (ACTIVE_STAGES.includes(stage)) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const closeDate = new Date(expectedCloseDate);
    closeDate.setHours(0, 0, 0, 0);

    if (closeDate < today) {
      errors.push('Expected close date cannot be in the past for active opportunities.');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  OPPORTUNITY_STAGES,
  ACTIVE_STAGES,
  calculateWeightedAmount,
  validateOpportunity
};
