import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, Edit3, Download } from 'lucide-react';
import StatementUpload from './StatementUpload';
import TransactionEditor from './TransactionEditor';
import ExportCSV from './ExportCSV';
import { parseStatement, findDuplicates, DEFAULT_CATEGORIES } from '../../utils/bankParsers';
import { DEFAULT_RULES, applyRulesToAllTransactions } from '../../utils/transactionRules';
import { cn } from '../../utils/cn';

const STEPS = [
  { id: 'upload', label: 'Upload Statements', icon: Upload },
  { id: 'edit', label: 'Review & Edit', icon: Edit3 },
  { id: 'export', label: 'Export', icon: Download },
];

export function BankAnalyzer({ darkMode }) {
  const [currentStep, setCurrentStep] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [duplicateIds, setDuplicateIds] = useState(new Set());
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  
  // Load rules from localStorage, fallback to defaults
  const [rules, setRules] = useState(() => {
    try {
      const saved = localStorage.getItem('bank-analyzer-rules');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load saved rules:', e);
    }
    return DEFAULT_RULES;
  });

  // Save rules to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('bank-analyzer-rules', JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to save rules:', e);
    }
  }, [rules]);

  const handleFilesUploaded = (files) => {
    setUploadedFiles(files);
  };

  const handleProceedToEdit = () => {
    // Parse all uploaded files
    const allTransactions = [];
    
    for (const file of uploadedFiles) {
      const parsed = parseStatement(file.csvData, file.bankType, file.purchaser);
      allTransactions.push(...parsed);
    }
    
    // Sort by date (newest first)
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
      const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
      return dateB - dateA;
    });
    
    // Filter by date range if specified
    let filteredTransactions = allTransactions;
    if (dateRange.startDate || dateRange.endDate) {
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
      
      // Set end date to end of day
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }
      
      filteredTransactions = allTransactions.filter(t => {
        const txnDate = new Date(t.date.year, t.date.month - 1, t.date.day);
        if (startDate && txnDate < startDate) return false;
        if (endDate && txnDate > endDate) return false;
        return true;
      });
    }
    
    // Apply auto-categorization rules
    const processedTransactions = applyRulesToAllTransactions(filteredTransactions, rules);
    
    // Find duplicates
    const dupes = findDuplicates(processedTransactions);
    
    setTransactions(processedTransactions);
    setDuplicateIds(dupes);
    setCurrentStep('edit');
  };

  const handleTransactionsUpdate = (updatedTransactions) => {
    setTransactions(updatedTransactions);
    // Recalculate duplicates
    const dupes = findDuplicates(updatedTransactions);
    setDuplicateIds(dupes);
  };

  const handleAddCategory = (newCategory) => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
  };

  const handleRulesChange = (newRules) => {
    setRules(newRules);
  };

  const handleReapplyRules = () => {
    const reprocessed = applyRulesToAllTransactions(transactions, rules);
    setTransactions(reprocessed);
  };

  const handleProceedToExport = () => {
    setCurrentStep('export');
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
  };

  const handleBackToEdit = () => {
    setCurrentStep('edit');
  };

  const handleStartOver = () => {
    setUploadedFiles([]);
    setTransactions([]);
    setDuplicateIds(new Set());
    setCategories(DEFAULT_CATEGORIES);
    setDateRange({ startDate: '', endDate: '' });
    // Keep rules - they persist across sessions
    setCurrentStep('upload');
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                isActive 
                  ? (darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-700')
                  : isCompleted
                    ? (darkMode ? 'text-green-400' : 'text-green-600')
                    : (darkMode ? 'text-gray-500' : 'text-gray-400')
              )}>
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm hidden sm:inline">{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className={cn(
                  'w-4 h-4 mx-2',
                  darkMode ? 'text-gray-600' : 'text-gray-300'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <StatementUpload
          darkMode={darkMode}
          uploadedFiles={uploadedFiles}
          onFilesChange={handleFilesUploaded}
          onProceed={handleProceedToEdit}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      )}

      {currentStep === 'edit' && (
        <TransactionEditor
          darkMode={darkMode}
          transactions={transactions}
          duplicateIds={duplicateIds}
          categories={categories}
          rules={rules}
          onTransactionsChange={handleTransactionsUpdate}
          onAddCategory={handleAddCategory}
          onRulesChange={handleRulesChange}
          onReapplyRules={handleReapplyRules}
          onBack={handleBackToUpload}
          onProceed={handleProceedToExport}
        />
      )}

      {currentStep === 'export' && (
        <ExportCSV
          darkMode={darkMode}
          transactions={transactions}
          onBack={handleBackToEdit}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}

export default BankAnalyzer;
