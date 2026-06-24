/**
 * Transaction Auto-Categorization Rules
 * Rules that automatically set description and category based on patterns
 */

// Default rules - these are applied when transactions are first loaded
export const DEFAULT_RULES = [
  {
    id: 'rule_costco',
    pattern: 'COSTCO WHSE',
    matchType: 'startsWith',
    action: 'categorize',
    newDescription: 'Costco',
    category: 'Groceries',
    enabled: true
  },
  {
    id: 'rule_chargepoint',
    pattern: 'CHARGEPOINT',
    matchType: 'startsWith',
    action: 'categorize',
    newDescription: 'Tesla Charging',
    category: 'Transport',
    enabled: true
  },
  {
    id: 'rule_tesla_supercharger',
    pattern: 'TESLA SUPERCHARGER',
    matchType: 'startsWith',
    action: 'categorize',
    newDescription: 'Tesla Charging',
    category: 'Transport',
    enabled: true
  },
  {
    id: 'rule_auto_transfer',
    pattern: 'Automatic Transfer to',
    matchType: 'contains',
    action: 'ignore',
    newDescription: '',
    category: '',
    enabled: true
  }
];

/**
 * Check if a description matches a rule pattern
 */
function matchesPattern(description, pattern, matchType) {
  const descUpper = description.toUpperCase();
  const patternUpper = pattern.toUpperCase();
  
  switch (matchType) {
    case 'startsWith':
      return descUpper.startsWith(patternUpper);
    case 'contains':
      return descUpper.includes(patternUpper);
    case 'endsWith':
      return descUpper.endsWith(patternUpper);
    case 'exact':
      return descUpper === patternUpper;
    default:
      return descUpper.startsWith(patternUpper);
  }
}

/**
 * Apply rules to a single transaction
 * Returns the modified transaction or null if it should be ignored
 */
export function applyRulesToTransaction(transaction, rules) {
  const enabledRules = rules.filter(r => r.enabled);
  
  for (const rule of enabledRules) {
    if (matchesPattern(transaction.description, rule.pattern, rule.matchType)) {
      // If action is 'ignore', mark for removal
      if (rule.action === 'ignore') {
        return {
          ...transaction,
          _ignored: true,
          appliedRuleId: rule.id
        };
      }
      
      // Default action is 'categorize'
      return {
        ...transaction,
        description: rule.newDescription,
        category: rule.category,
        originalDescription: transaction.originalDescription || transaction.description,
        appliedRuleId: rule.id
      };
    }
  }
  
  return transaction;
}

/**
 * Apply rules to all transactions
 * Returns array of modified transactions (ignored ones are filtered out)
 */
export function applyRulesToAllTransactions(transactions, rules, filterIgnored = true) {
  const processed = transactions.map(t => applyRulesToTransaction(t, rules));
  
  if (filterIgnored) {
    return processed.filter(t => !t._ignored);
  }
  
  return processed;
}

/**
 * Generate a unique rule ID
 */
export function generateRuleId() {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new rule
 */
export function createRule(pattern, newDescription, category, matchType = 'startsWith', action = 'categorize') {
  return {
    id: generateRuleId(),
    pattern,
    matchType,
    action,
    newDescription,
    category,
    enabled: true
  };
}
