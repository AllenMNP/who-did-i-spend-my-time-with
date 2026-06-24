import { ArrowLeft, Download, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/bankParsers';
import { cn } from '../../utils/cn';

export function ExportCSV({ darkMode, transactions, onBack, onStartOver }) {
  const incomeTransactions = transactions.filter(t => t.isIncome);
  const expenseTransactions = transactions.filter(t => !t.isIncome);

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const generateExpensesCSV = () => {
    const headers = ['Date', 'Amount', 'Description', 'Purchaser', 'Category'];
    const rows = expenseTransactions.map(t => [
      formatDate(t.date),
      t.amount.toFixed(2),
      `"${t.description.replace(/"/g, '""')}"`,
      t.purchaser,
      t.category || ''
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const generateIncomeCSV = () => {
    const headers = ['Date', 'Amount', 'Description', 'Category'];
    const rows = incomeTransactions.map(t => [
      formatDate(t.date),
      t.amount.toFixed(2),
      `"${t.description.replace(/"/g, '""')}"`,
      t.category || ''
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadExpenses = () => {
    const csv = generateExpensesCSV();
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `expenses-${date}.csv`);
  };

  const handleDownloadIncome = () => {
    const csv = generateIncomeCSV();
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `income-${date}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Ready to Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={cn(
              'p-4 rounded-lg text-center',
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            )}>
              <p className={cn('text-sm', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                Total Transactions
              </p>
              <p className={cn('text-2xl font-bold', darkMode ? 'text-white' : 'text-gray-900')}>
                {transactions.length}
              </p>
            </div>
            <div className={cn(
              'p-4 rounded-lg text-center',
              darkMode ? 'bg-red-900/20' : 'bg-red-50'
            )}>
              <p className={cn('text-sm', darkMode ? 'text-red-400' : 'text-red-600')}>
                Total Expenses
              </p>
              <p className={cn('text-2xl font-bold', darkMode ? 'text-red-400' : 'text-red-600')}>
                ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className={cn('text-xs', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                {expenseTransactions.length} transactions
              </p>
            </div>
            <div className={cn(
              'p-4 rounded-lg text-center',
              darkMode ? 'bg-green-900/20' : 'bg-green-50'
            )}>
              <p className={cn('text-sm', darkMode ? 'text-green-400' : 'text-green-600')}>
                Total Income
              </p>
              <p className={cn('text-2xl font-bold', darkMode ? 'text-green-400' : 'text-green-600')}>
                ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className={cn('text-xs', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                {incomeTransactions.length} transactions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expenses Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              Expenses CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(
              'p-3 rounded-lg text-sm',
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            )}>
              <p className={cn('font-medium mb-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                Columns:
              </p>
              <div className="flex flex-wrap gap-2">
                {['Date', 'Amount', 'Description', 'Purchaser', 'Category'].map(col => (
                  <span 
                    key={col}
                    className={cn(
                      'px-2 py-1 rounded text-xs',
                      darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
            <Button 
              onClick={handleDownloadExpenses}
              disabled={expenseTransactions.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Expenses ({expenseTransactions.length} rows)
            </Button>
          </CardContent>
        </Card>

        {/* Income Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              Income CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(
              'p-3 rounded-lg text-sm',
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            )}>
              <p className={cn('font-medium mb-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                Columns:
              </p>
              <div className="flex flex-wrap gap-2">
                {['Date', 'Amount', 'Description', 'Category'].map(col => (
                  <span 
                    key={col}
                    className={cn(
                      'px-2 py-1 rounded text-xs',
                      darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
            <Button 
              onClick={handleDownloadIncome}
              disabled={incomeTransactions.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Income ({incomeTransactions.length} rows)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Preview (First 5 rows)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {expenseTransactions.length > 0 && (
            <div>
              <h4 className={cn('font-medium mb-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                Expenses
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn('border-b', darkMode ? 'border-gray-700' : 'border-gray-200')}>
                      <th className={cn('text-left py-2 px-2', darkMode ? 'text-gray-400' : 'text-gray-600')}>Date</th>
                      <th className={cn('text-left py-2 px-2', darkMode ? 'text-gray-400' : 'text-gray-600')}>Amount</th>
                      <th className={cn('text-left py-2 px-2', darkMode ? 'text-gray-400' : 'text-gray-600')}>Description</th>
                      <th className={cn('text-left py-2 px-2', darkMode ? 'text-gray-400' : 'text-gray-600')}>Purchaser</th>
                      <th className={cn('text-left py-2 px-2', darkMode ? 'text-gray-400' : 'text-gray-600')}>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseTransactions.slice(0, 5).map(t => (
                      <tr key={t.id} className={cn('border-b', darkMode ? 'border-gray-700' : 'border-gray-100')}>
                        <td className={cn('py-2 px-2', darkMode ? 'text-gray-200' : 'text-gray-800')}>{formatDate(t.date)}</td>
                        <td className={cn('py-2 px-2', darkMode ? 'text-gray-200' : 'text-gray-800')}>${t.amount.toFixed(2)}</td>
                        <td className={cn('py-2 px-2 truncate max-w-[200px]', darkMode ? 'text-gray-200' : 'text-gray-800')}>{t.description}</td>
                        <td className={cn('py-2 px-2', darkMode ? 'text-gray-200' : 'text-gray-800')}>{t.purchaser}</td>
                        <td className={cn('py-2 px-2', darkMode ? 'text-gray-200' : 'text-gray-800')}>{t.category || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {incomeTransactions.length > 0 && (
            <div>
              <h4 className={cn('font-medium mb-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                Income
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn('border-b', darkMode ? 'border-gray-700' : 'border-gray-200')}>
                      <th className={cn('text-left py-2 px-2', darkMode ? 'text-gray-400' : 'text-gray-600')}>Date</th>
                      <th className={cn('text-left py-2 px-2', darkMode ? 'text-gray-400' : 'text-gray-600')}>Amount</th>
                      <th className={cn('text-left py-2 px-2', darkMode ? 'text-gray-400' : 'text-gray-600')}>Description</th>
                      <th className={cn('text-left py-2 px-2', darkMode ? 'text-gray-400' : 'text-gray-600')}>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeTransactions.slice(0, 5).map(t => (
                      <tr key={t.id} className={cn('border-b', darkMode ? 'border-gray-700' : 'border-gray-100')}>
                        <td className={cn('py-2 px-2', darkMode ? 'text-gray-200' : 'text-gray-800')}>{formatDate(t.date)}</td>
                        <td className={cn('py-2 px-2', darkMode ? 'text-gray-200' : 'text-gray-800')}>${t.amount.toFixed(2)}</td>
                        <td className={cn('py-2 px-2 truncate max-w-[200px]', darkMode ? 'text-gray-200' : 'text-gray-800')}>{t.description}</td>
                        <td className={cn('py-2 px-2', darkMode ? 'text-gray-200' : 'text-gray-800')}>{t.category || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Edit
        </Button>
        <Button variant="outline" onClick={onStartOver}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Start Over
        </Button>
      </div>
    </div>
  );
}

export default ExportCSV;
