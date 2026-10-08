const { canTransitionLead, canConvertLead, LEAD_STATUSES } = require('../src/domain/leadWorkflow');

describe('Lead Workflow State Transitions & Conversion Rules', () => {
  test('should allow transition from New to Contacted', () => {
    const res = canTransitionLead(LEAD_STATUSES.NEW, LEAD_STATUSES.CONTACTED);
    expect(res.allowed).toBe(true);
  });

  test('should allow transition from Contacted to Qualified', () => {
    const res = canTransitionLead(LEAD_STATUSES.CONTACTED, LEAD_STATUSES.QUALIFIED);
    expect(res.allowed).toBe(true);
  });

  test('should allow transition from Qualified to Converted', () => {
    const res = canTransitionLead(LEAD_STATUSES.QUALIFIED, LEAD_STATUSES.CONVERTED);
    expect(res.allowed).toBe(true);
  });

  test('should forbid direct jump from New to Converted without qualification', () => {
    const res = canTransitionLead(LEAD_STATUSES.NEW, LEAD_STATUSES.CONVERTED);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Invalid lead status transition');
  });

  test('should forbid moving a Converted lead back to New (terminal state)', () => {
    const res = canTransitionLead(LEAD_STATUSES.CONVERTED, LEAD_STATUSES.NEW);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Terminal state');
  });

  test('should allow conversion only for Qualified leads', () => {
    const qualifiedLead = { id: 1, status: LEAD_STATUSES.QUALIFIED };
    const newLead = { id: 2, status: LEAD_STATUSES.NEW };
    const convertedLead = { id: 3, status: LEAD_STATUSES.CONVERTED };

    expect(canConvertLead(qualifiedLead).allowed).toBe(true);
    expect(canConvertLead(newLead).allowed).toBe(false);
    expect(canConvertLead(convertedLead).allowed).toBe(false);
  });
});
