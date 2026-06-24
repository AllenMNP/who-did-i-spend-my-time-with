/**
 * Bank Statement Parsers
 * Parses CSV data from different banks and normalizes to a common format
 */

// Detect bank type from CSV headers
export function detectBankType(headers) {
  const headerStr = headers.map(h => h?.toLowerCase?.() || '').join(',');
  
  if (headerStr.includes('status') && headerStr.includes('debit') && headerStr.includes('credit') && headerStr.includes('member name')) {
    return 'citi';
  }
  if (headerStr.includes('posted date') && headerStr.includes('reference number') && headerStr.includes('payee')) {
    return 'boa_credit';
  }
  if (headerStr.includes('running bal')) {
    return 'boa_checking';
  }
  if (headerStr.includes('transaction date') && headerStr.includes('post date') && headerStr.includes('type')) {
    return 'chase';
  }
  
  return 'unknown';
}

// Get display name for bank type
export function getBankDisplayName(bankType) {
  const names = {
    'citi': 'Citi Bank',
    'boa_credit': 'Bank of America Credit Card',
    'boa_checking': 'Bank of America Checking',
    'chase': 'Chase',
    'unknown': 'Unknown Bank'
  };
  return names[bankType] || 'Unknown Bank';
}

// Parse amount string to number (handles commas, negative signs, parentheses)
function parseAmount(amountStr) {
  if (!amountStr || amountStr.trim() === '') return null;
  
  // Remove currency symbols, commas, and whitespace
  let cleaned = amountStr.replace(/[$,\s]/g, '');
  
  // Handle parentheses as negative (accounting format)
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Parse date to consistent format
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
      return { month, day, year, original: dateStr };
    }
  }
  
  return { original: dateStr };
}

// Format date as M/D/YYYY (no leading zeros)
export function formatDate(dateObj) {
  if (!dateObj) return '';
  if (dateObj.month && dateObj.day && dateObj.year) {
    return `${dateObj.month}/${dateObj.day}/${dateObj.year}`;
  }
  return dateObj.original || '';
}

// Parse Citi Bank CSV
function parseCiti(rows, purchaser) {
  const transactions = [];
  
  for (const row of rows) {
    // Skip empty rows or summary rows
    if (!row[1] || !row[2]) continue;
    
    const date = parseDate(row[1]); // Date column
    const description = row[2]?.trim() || ''; // Description column
    const debit = parseAmount(row[3]); // Debit column
    const credit = parseAmount(row[4]); // Credit column
    
    if (!date) continue;
    
    // Debit = expense (money out), Credit = income (money in)
    if (debit !== null && debit > 0) {
      transactions.push({
        id: generateTransactionId(),
        date,
        amount: debit,
        description,
        purchaser,
        category: '',
        isIncome: false,
        bankType: 'citi'
      });
    }
    
    if (credit !== null && credit > 0) {
      transactions.push({
        id: generateTransactionId(),
        date,
        amount: credit,
        description,
        purchaser,
        category: '',
        isIncome: true,
        bankType: 'citi'
      });
    }
  }
  
  return transactions;
}

// Parse Bank of America Checking CSV
function parseBoAChecking(rows, purchaser) {
  const transactions = [];
  
  for (const row of rows) {
    // Skip summary rows (Beginning balance, Total credits, etc.)
    const description = row[1]?.trim() || '';
    if (description.toLowerCase().includes('beginning balance') || 
        description.toLowerCase().includes('total credits') ||
        description.toLowerCase().includes('total debits') ||
        description.toLowerCase().includes('ending balance')) {
      continue;
    }
    
    const date = parseDate(row[0]); // Date column
    const amount = parseAmount(row[2]); // Amount column
    
    if (!date || amount === null) continue;
    
    // Positive = income, Negative = expense
    transactions.push({
      id: generateTransactionId(),
      date,
      amount: Math.abs(amount),
      description,
      purchaser,
      category: '',
      isIncome: amount > 0,
      bankType: 'boa_checking'
    });
  }
  
  return transactions;
}

// Parse Bank of America Credit Card CSV
function parseBoACredit(rows, purchaser) {
  const transactions = [];
  
  for (const row of rows) {
    const date = parseDate(row[0]); // Posted Date column
    const description = row[2]?.trim() || ''; // Payee column
    const amount = parseAmount(row[4]); // Amount column
    
    if (!date || amount === null) continue;
    
    // Skip payment thank you rows for income, but include them
    // Positive = payment/credit (income), Negative = expense
    transactions.push({
      id: generateTransactionId(),
      date,
      amount: Math.abs(amount),
      description,
      purchaser,
      category: '',
      isIncome: amount > 0,
      bankType: 'boa_credit'
    });
  }
  
  return transactions;
}

// Parse Chase CSV
function parseChase(rows, purchaser) {
  const transactions = [];
  
  for (const row of rows) {
    const date = parseDate(row[0]); // Transaction Date column
    const description = row[2]?.trim() || ''; // Description column
    const amount = parseAmount(row[5]); // Amount column
    
    if (!date || amount === null) continue;
    
    // Negative = expense, Positive = income/refund
    transactions.push({
      id: generateTransactionId(),
      date,
      amount: Math.abs(amount),
      description,
      purchaser,
      category: '',
      isIncome: amount > 0,
      bankType: 'chase'
    });
  }
  
  return transactions;
}

// Generate unique transaction ID
function generateTransactionId() {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Main parser function
export function parseStatement(csvData, bankType, purchaser) {
  // Skip header row
  const rows = csvData.slice(1).filter(row => row.some(cell => cell?.trim?.()));
  
  switch (bankType) {
    case 'citi':
      return parseCiti(rows, purchaser);
    case 'boa_checking':
      return parseBoAChecking(rows, purchaser);
    case 'boa_credit':
      return parseBoACredit(rows, purchaser);
    case 'chase':
      return parseChase(rows, purchaser);
    default:
      return [];
  }
}

// Detect duplicates across transactions
export function findDuplicates(transactions) {
  const seen = new Map();
  const duplicates = new Set();
  
  for (const txn of transactions) {
    // Create a key from date + amount + description (normalized)
    const dateKey = formatDate(txn.date);
    const key = `${dateKey}|${txn.amount.toFixed(2)}|${txn.description.toLowerCase().trim()}`;
    
    if (seen.has(key)) {
      duplicates.add(txn.id);
      duplicates.add(seen.get(key));
    } else {
      seen.set(key, txn.id);
    }
  }
  
  return duplicates;
}

// Default categories
export const DEFAULT_CATEGORIES = [
  'Home',
  'Utilities',
  'Debt',
  'Groceries',
  'Restaurants',
  'Transport',
  'Retirement',
  'Personal',
  'Health',
  'Gifts',
  'Travel',
  'Unexpected',
  'Wedding',
  'Other'
];
