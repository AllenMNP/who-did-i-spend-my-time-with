import { useState } from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle, Trash2, Plus, Check, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Input';
import Modal from '../ui/Modal';
import RulesManager from './RulesManager';
import { formatDate } from '../../utils/bankParsers';
import { cn } from '../../utils/cn';

const PURCHASERS = ['Allen', 'Carolyn'];

export function TransactionEditor({ 
  darkMode, 
  transactions, 
  duplicateIds, 
  categories,
  rules,
  onTransactionsChange, 
  onAddCategory,
  onRulesChange,
  onReapplyRules,
  onBack, 
  onProceed 
}) {
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const incomeTransactions = transactions.filter(t => t.isIncome);
  const expenseTransactions = transactions.filter(t => !t.isIncome);

  const handleUpdateTransaction = (id, field, value) => {
    const updated = transactions.map(t => {
      if (t.id === id) {
        if (field === 'amount') {
          const numValue = parseFloat(value);
          return { ...t, [field]: isNaN(numValue) ? 0 : numValue };
        }
        return { ...t, [field]: value };
      }
      return t;
    });
    onTransactionsChange(updated);
  };

  const handleDeleteTransaction = (id) => {
    onTransactionsChange(transactions.filter(t => t.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    onTransactionsChange(transactions.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (isIncome) => {
    const targetTransactions = isIncome ? incomeTransactions : expenseTransactions;
    const allSelected = targetTransactions.every(t => selectedIds.has(t.id));
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        targetTransactions.forEach(t => next.delete(t.id));
      } else {
        targetTransactions.forEach(t => next.add(t.id));
      }
      return next;
    });
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategoryModal(false);
    }
  };

  const renderTransactionTable = (txns, isIncome) => {
    const allSelected = txns.length > 0 && txns.every(t => selectedIds.has(t.id));
    const someSelected = txns.some(t => selectedIds.has(t.id));

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={cn(
              'border-b',
              darkMode ? 'border-gray-700' : 'border-gray-200'
            )}>
              <th className="text-left py-3 px-2 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={() => handleSelectAll(isIncome)}
                  className="rounded"
                />
              </th>
              <th className={cn('text-left py-3 px-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>Date</th>
              <th className={cn('text-left py-3 px-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>Amount</th>
              <th className={cn('text-left py-3 px-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>Description</th>
              {!isIncome && (
                <th className={cn('text-left py-3 px-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>Purchaser</th>
              )}
              <th className={cn('text-left py-3 px-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>Category</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {txns.map(txn => {
              const isDuplicate = duplicateIds.has(txn.id);
              return (
                <tr 
                  key={txn.id}
                  className={cn(
                    'border-b transition-colors',
                    darkMode ? 'border-gray-700' : 'border-gray-100',
                    isDuplicate && (darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'),
                    selectedIds.has(txn.id) && (darkMode ? 'bg-blue-900/20' : 'bg-blue-50')
                  )}
                >
                  <td className="py-2 px-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(txn.id)}
                      onChange={() => handleToggleSelect(txn.id)}
                      className="rounded"
                    />
                  </td>
                  <td className={cn('py-2 px-2', darkMode ? 'text-gray-100' : 'text-gray-900')}>
                    <div className="flex items-center gap-1">
                      {isDuplicate && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" title="Possible duplicate" />
                      )}
                      {formatDate(txn.date)}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={txn.amount}
                      onChange={(e) => handleUpdateTransaction(txn.id, 'amount', e.target.value)}
                      className="w-24"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={txn.description}
                      onChange={(e) => handleUpdateTransaction(txn.id, 'description', e.target.value)}
                      className="min-w-[200px]"
                    />
                  </td>
                  {!isIncome && (
                    <td className="py-2 px-2">
                      <Select
                        value={txn.purchaser}
                        onChange={(e) => handleUpdateTransaction(txn.id, 'purchaser', e.target.value)}
                        className="w-28"
                      >
                        {PURCHASERS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </Select>
                    </td>
                  )}
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <Select
                        value={txn.category}
                        onChange={(e) => handleUpdateTransaction(txn.id, 'category', e.target.value)}
                        className="w-32"
                      >
                        <option value="">Select...</option>
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddCategoryModal(true)}
                        className="p-1"
                        title="Add new category"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTransaction(txn.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {txns.length === 0 && (
          <div className={cn(
            'text-center py-8',
            darkMode ? 'text-gray-500' : 'text-gray-400'
          )}>
            No {isIncome ? 'income' : 'expense'} transactions
          </div>
        )}
      </div>
    );
  };

  const duplicateCount = duplicateIds.size;

  return (
    <>
      <div className="space-y-6">
        {/* Duplicate Warning */}
        {duplicateCount > 0 && (
          <div className={cn(
            'p-4 rounded-lg flex items-center gap-3',
            darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
          )}>
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div>
              <p className={cn('font-medium', darkMode ? 'text-yellow-400' : 'text-yellow-700')}>
                {duplicateCount} possible duplicate{duplicateCount > 1 ? 's' : ''} detected
              </p>
              <p className={cn('text-sm', darkMode ? 'text-yellow-500' : 'text-yellow-600')}>
                Transactions with the same date, amount, and description are highlighted
              </p>
            </div>
          </div>
        )}

        {/* Rules Manager */}
        <RulesManager
          darkMode={darkMode}
          rules={rules}
          categories={categories}
          onRulesChange={onRulesChange}
        />

        {/* Re-apply Rules Button */}
        {rules.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onReapplyRules}
              title="Re-apply all rules to transactions"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-apply Rules
            </Button>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className={cn(
            'p-3 rounded-lg flex items-center justify-between',
            darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
          )}>
            <span className={darkMode ? 'text-blue-400' : 'text-blue-700'}>
              {selectedIds.size} transaction{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              className="text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        )}

        {/* Expenses Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={cn(
                'w-3 h-3 rounded-full',
                darkMode ? 'bg-red-500' : 'bg-red-500'
              )} />
              Expenses ({expenseTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {renderTransactionTable(expenseTransactions, false)}
          </CardContent>
        </Card>

        {/* Income Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={cn(
                'w-3 h-3 rounded-full',
                darkMode ? 'bg-green-500' : 'bg-green-500'
              )} />
              Income ({incomeTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {renderTransactionTable(incomeTransactions, true)}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button onClick={onProceed}>
            Continue to Export
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        title="Add New Category"
      >
        <div className="space-y-4">
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCategory();
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddCategoryModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>
              <Check className="w-4 h-4 mr-1" />
              Add Category
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default TransactionEditor;
