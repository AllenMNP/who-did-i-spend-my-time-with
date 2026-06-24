import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Settings, ChevronDown, ChevronUp, EyeOff, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Input';
import Modal from '../ui/Modal';
import { createRule } from '../../utils/transactionRules';
import { cn } from '../../utils/cn';

const MATCH_TYPES = [
  { value: 'startsWith', label: 'Starts with' },
  { value: 'contains', label: 'Contains' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'exact', label: 'Exact match' },
];

const ACTION_TYPES = [
  { value: 'categorize', label: 'Categorize', icon: Tag, description: 'Set description and category' },
  { value: 'ignore', label: 'Ignore', icon: EyeOff, description: 'Remove from review' },
];

export function RulesManager({ darkMode, rules, categories, onRulesChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  
  const [newPattern, setNewPattern] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newMatchType, setNewMatchType] = useState('startsWith');
  const [newAction, setNewAction] = useState('categorize');

  const resetForm = () => {
    setNewPattern('');
    setNewDescription('');
    setNewCategory('');
    setNewMatchType('startsWith');
    setNewAction('categorize');
    setEditingRule(null);
  };

  const handleAddRule = () => {
    if (!newPattern.trim()) return;
    if (newAction === 'categorize' && !newDescription.trim()) return;
    
    const rule = createRule(
      newPattern.trim(), 
      newAction === 'ignore' ? '' : newDescription.trim(), 
      newAction === 'ignore' ? '' : newCategory, 
      newMatchType,
      newAction
    );
    onRulesChange([...rules, rule]);
    resetForm();
    setShowAddModal(false);
  };

  const handleUpdateRule = () => {
    if (!editingRule || !newPattern.trim()) return;
    if (newAction === 'categorize' && !newDescription.trim()) return;
    
    const updated = rules.map(r => 
      r.id === editingRule.id 
        ? { 
            ...r, 
            pattern: newPattern.trim(), 
            newDescription: newAction === 'ignore' ? '' : newDescription.trim(), 
            category: newAction === 'ignore' ? '' : newCategory, 
            matchType: newMatchType,
            action: newAction
          }
        : r
    );
    onRulesChange(updated);
    resetForm();
    setShowAddModal(false);
  };

  const handleDeleteRule = (ruleId) => {
    onRulesChange(rules.filter(r => r.id !== ruleId));
  };

  const handleToggleRule = (ruleId) => {
    onRulesChange(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setNewPattern(rule.pattern);
    setNewDescription(rule.newDescription || '');
    setNewCategory(rule.category || '');
    setNewMatchType(rule.matchType);
    setNewAction(rule.action || 'categorize');
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setShowAddModal(false);
  };

  const enabledCount = rules.filter(r => r.enabled).length;

  return (
    <>
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Auto-Categorization Rules
              <span className={cn(
                'text-sm font-normal px-2 py-0.5 rounded-full',
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              )}>
                {enabledCount} active
              </span>
            </CardTitle>
            {isExpanded ? (
              <ChevronUp className={cn('w-5 h-5', darkMode ? 'text-gray-400' : 'text-gray-500')} />
            ) : (
              <ChevronDown className={cn('w-5 h-5', darkMode ? 'text-gray-400' : 'text-gray-500')} />
            )}
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4">
            <p className={cn('text-sm', darkMode ? 'text-gray-400' : 'text-gray-500')}>
              Rules automatically update transaction descriptions and categories, or ignore transactions entirely.
            </p>
            
            {/* Rules List */}
            <div className="space-y-2">
              {rules.map(rule => (
                <div 
                  key={rule.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    rule.enabled 
                      ? (darkMode ? 'bg-gray-700/50' : 'bg-gray-50')
                      : (darkMode ? 'bg-gray-800/50 opacity-60' : 'bg-gray-100/50 opacity-60')
                  )}
                >
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => handleToggleRule(rule.id)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'
                      )}>
                        {MATCH_TYPES.find(m => m.value === rule.matchType)?.label || 'Starts with'}
                      </span>
                      <code className={cn(
                        'text-sm px-2 py-0.5 rounded',
                        darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'
                      )}>
                        {rule.pattern}
                      </code>
                    </div>
                    <div className={cn('text-sm mt-1', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                      {rule.action === 'ignore' ? (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded',
                          darkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'
                        )}>
                          <EyeOff className="w-3 h-3 inline mr-1" />
                          Ignore / Remove
                        </span>
                      ) : (
                        <>
                          → <strong>{rule.newDescription}</strong>
                          {rule.category && (
                            <span className={cn(
                              'ml-2 text-xs px-2 py-0.5 rounded',
                              darkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                            )}>
                              {rule.category}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                      className="p-2"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {rules.length === 0 && (
                <div className={cn(
                  'text-center py-6',
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                )}>
                  No rules defined. Add a rule to auto-categorize transactions.
                </div>
              )}
            </div>
            
            {/* Add Rule Button */}
            <Button
              variant="outline"
              onClick={() => setShowAddModal(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Add/Edit Rule Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingRule ? 'Edit Rule' : 'Add New Rule'}
      >
        <div className="space-y-4">
          {/* Action Type */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>
              Action
            </label>
            <div className="flex gap-2">
              {ACTION_TYPES.map(action => {
                const Icon = action.icon;
                const isSelected = newAction === action.value;
                return (
                  <button
                    key={action.value}
                    type="button"
                    onClick={() => setNewAction(action.value)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors',
                      isSelected
                        ? (darkMode ? 'border-blue-500 bg-blue-900/30 text-blue-400' : 'border-blue-500 bg-blue-50 text-blue-700')
                        : (darkMode ? 'border-gray-600 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-600 hover:border-gray-300')
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{action.label}</span>
                  </button>
                );
              })}
            </div>
            <p className={cn('text-xs mt-2', darkMode ? 'text-gray-500' : 'text-gray-400')}>
              {ACTION_TYPES.find(a => a.value === newAction)?.description}
            </p>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
              Match Type
            </label>
            <Select
              value={newMatchType}
              onChange={(e) => setNewMatchType(e.target.value)}
            >
              {MATCH_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
              Pattern to Match
            </label>
            <Input
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              placeholder="e.g., COSTCO WHSE"
            />
            <p className={cn('text-xs mt-1', darkMode ? 'text-gray-500' : 'text-gray-400')}>
              Case-insensitive matching
            </p>
          </div>
          
          {newAction === 'categorize' && (
            <>
              <div>
                <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                  New Description
                </label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g., Costco"
                />
              </div>
              
              <div>
                <label className={cn('block text-sm font-medium mb-1', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                  Category
                </label>
                <Select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="">No category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              onClick={editingRule ? handleUpdateRule : handleAddRule}
              disabled={!newPattern.trim() || (newAction === 'categorize' && !newDescription.trim())}
            >
              <Check className="w-4 h-4 mr-1" />
              {editingRule ? 'Update Rule' : 'Add Rule'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default RulesManager;
