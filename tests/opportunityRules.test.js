const { calculateWeightedAmount, validateOpportunity } = require('../src/domain/opportunityRules');

describe('Opportunity Business Rules & Calculations', () => {
  test('should accurately calculate weighted pipeline value', () => {
    // 50,000 at 60% probability = 30,000
    expect(calculateWeightedAmount(50000, 60)).toBe(30000);
    // 10,000 at 35% probability = 3,500
    expect(calculateWeightedAmount(10000, 35)).toBe(3500);
    // Rounding handling
    expect(calculateWeightedAmount(1234.56, 33.33)).toBe(411.48);
  });

  test('should reject non-positive amounts for active opportunities', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const res = validateOpportunity({
      stage: 'Proposal',
      amount: 0,
      probability: 50,
      expectedCloseDate: futureDate
    });
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Opportunity amount must be greater than zero.');
  });

  test('should reject probabilities outside 0 to 100 range', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const resOver = validateOpportunity({
      stage: 'Proposal',
      amount: 1000,
      probability: 110,
      expectedCloseDate: futureDate
    });
    expect(resOver.valid).toBe(false);
    expect(resOver.errors).toContain('Probability must be an integer between 0 and 100.');
  });

  test('should reject expected close dates in the past for active opportunities', () => {
    const pastDate = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
    const res = validateOpportunity({
      stage: 'Proposal',
      amount: 1000,
      probability: 50,
      expectedCloseDate: pastDate
    });
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Expected close date cannot be in the past for active opportunities.');
  });

  test('should accept valid active opportunity', () => {
    const futureDate = new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0];
    const res = validateOpportunity({
      stage: 'Negotiation',
      amount: 45000,
      probability: 75,
      expectedCloseDate: futureDate
    });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });
});
