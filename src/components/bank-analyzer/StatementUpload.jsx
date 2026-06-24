import { useState, useRef } from 'react';
import { Upload, FileText, Trash2, AlertCircle, User, Calendar } from 'lucide-react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { Input, Label, Select } from '../ui/Input';
import { detectBankType, getBankDisplayName } from '../../utils/bankParsers';
import { cn } from '../../utils/cn';

const PURCHASERS = ['Allen', 'Carolyn'];

export function StatementUpload({ darkMode, uploadedFiles, onFilesChange, onProceed, dateRange, onDateRangeChange }) {
  const [selectedPurchaser, setSelectedPurchaser] = useState('Allen');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'text/csv' || f.name.endsWith('.csv')
    );
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const processFiles = (files) => {
    setError('');
    
    files.forEach(file => {
      Papa.parse(file, {
        complete: (results) => {
          if (results.data.length > 0) {
            const headers = results.data[0];
            const bankType = detectBankType(headers);
            
            if (bankType === 'unknown') {
              setError(`Could not detect bank type for "${file.name}". Please ensure it's from a supported bank.`);
              return;
            }
            
            const newFile = {
              id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              bankType,
              purchaser: selectedPurchaser,
              csvData: results.data,
              rowCount: results.data.length - 1, // Exclude header
            };
            
            onFilesChange([...uploadedFiles, newFile]);
          }
        },
        error: (err) => {
          setError(`Failed to parse "${file.name}": ${err.message}`);
        }
      });
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId) => {
    onFilesChange(uploadedFiles.filter(f => f.id !== fileId));
  };

  const handleUpdatePurchaser = (fileId, purchaser) => {
    onFilesChange(uploadedFiles.map(f => 
      f.id === fileId ? { ...f, purchaser } : f
    ));
  };

  const canProceed = uploadedFiles.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Bank Statements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Filter */}
        <div className={cn(
          'p-4 rounded-lg',
          darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
        )}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className={cn('w-5 h-5', darkMode ? 'text-gray-400' : 'text-gray-500')} />
            <span className={cn('font-medium', darkMode ? 'text-white' : 'text-gray-900')}>
              Date Range Filter (Optional)
            </span>
          </div>
          <p className={cn('text-sm mb-3', darkMode ? 'text-gray-400' : 'text-gray-500')}>
            Only transactions within this date range will be extracted from all uploaded statements.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            {(dateRange.startDate || dateRange.endDate) && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDateRangeChange({ startDate: '', endDate: '' })}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Purchaser Selection */}
        <div className="max-w-xs">
          <Label>Default Purchaser for New Uploads</Label>
          <Select
            value={selectedPurchaser}
            onChange={(e) => setSelectedPurchaser(e.target.value)}
          >
            {PURCHASERS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            darkMode 
              ? 'border-gray-600 hover:border-blue-500' 
              : 'border-gray-300 hover:border-blue-400'
          )}
        >
          <Upload className={cn(
            'w-12 h-12 mx-auto mb-4',
            darkMode ? 'text-gray-500' : 'text-gray-400'
          )} />
          <p className={cn('mb-2', darkMode ? 'text-gray-300' : 'text-gray-600')}>
            Drag and drop CSV files here, or click to select
          </p>
          <p className={cn('text-sm', darkMode ? 'text-gray-500' : 'text-gray-400')}>
            Supported banks: Citi Bank, Bank of America (Checking & Credit Card), Chase
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className={cn(
            'p-3 rounded-lg flex items-center gap-2',
            darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
          )}>
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className={darkMode ? 'text-red-400' : 'text-red-700'}>{error}</span>
          </div>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className={cn('font-medium', darkMode ? 'text-white' : 'text-gray-900')}>
              Uploaded Files ({uploadedFiles.length})
            </h4>
            <div className="space-y-2">
              {uploadedFiles.map(file => (
                <div 
                  key={file.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  )}
                >
                  <FileText className={cn(
                    'w-5 h-5 flex-shrink-0',
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium truncate',
                      darkMode ? 'text-white' : 'text-gray-900'
                    )}>
                      {file.name}
                    </p>
                    <p className={cn(
                      'text-sm',
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    )}>
                      {getBankDisplayName(file.bankType)} • {file.rowCount} rows
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <User className={cn(
                        'w-4 h-4',
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      )} />
                      <Select
                        value={file.purchaser}
                        onChange={(e) => handleUpdatePurchaser(file.id, e.target.value)}
                        className="w-28"
                      >
                        {PURCHASERS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proceed Button */}
        <div className="flex justify-end">
          <Button
            onClick={onProceed}
            disabled={!canProceed}
          >
            Continue to Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatementUpload;
