export function jurisdictionFromRuleId(ruleId: string): string {
  const lower = ruleId.toLowerCase();

  if (lower.startsWith('federal')) return 'Federal';

  if (lower.startsWith('state:')) {
    const st = ruleId.split(':')[1]?.toUpperCase() || '';
    return st ? `State (${st})` : 'State';
  }

  if (lower.startsWith('city:')) return 'City';

  // IMPORTANT: no fallback to primary state here
  return 'General';
}