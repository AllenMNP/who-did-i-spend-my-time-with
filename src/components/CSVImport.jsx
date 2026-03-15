import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Check } from 'lucide-react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Label, Select } from './ui/Input';
import { generateId } from '../utils/helpers';

export function CSVImport({ friends, categories, onImport, onAddFriend, onAddCategory }) {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({
    date: '',
    friend: '',
    hours: '',
    category: '',
    notes: '',
  });
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportSuccess(false);
    setErrors([]);

    Papa.parse(selectedFile, {
      complete: (results) => {
        if (results.data.length > 0) {
          const headerRow = results.data[0];
          setHeaders(headerRow);
          setCsvData(results.data.slice(1).filter(row => row.some(cell => cell)));
          
          // Auto-detect column mapping
          const autoMapping = { date: '', friend: '', hours: '', category: '', notes: '' };
          headerRow.forEach((header, idx) => {
            const h = header.toLowerCase();
            if (h.includes('date')) autoMapping.date = idx.toString();
            else if (h.includes('friend') || h.includes('name') || h.includes('person')) autoMapping.friend = idx.toString();
            else if (h.includes('hour') || h.includes('duration') || h.includes('time')) autoMapping.hours = idx.toString();
            else if (h.includes('category') || h.includes('type') || h.includes('activity')) autoMapping.category = idx.toString();
            else if (h.includes('note') || h.includes('description') || h.includes('comment')) autoMapping.notes = idx.toString();
          });
          setMapping(autoMapping);
        }
      },
      error: (error) => {
        setErrors([`Failed to parse CSV: ${error.message}`]);
      }
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      const fakeEvent = { target: { files: [droppedFile] } };
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const validateAndPreview = () => {
    if (!mapping.date || !mapping.friend || !mapping.hours) {
      setErrors(['Please map at least Date, Friend, and Hours columns']);
      return;
    }

    const previewData = [];
    const validationErrors = [];

    csvData.slice(0, 5).forEach((row, idx) => {
      const dateVal = row[parseInt(mapping.date)];
      const friendVal = row[parseInt(mapping.friend)];
      const hoursVal = row[parseInt(mapping.hours)];
      const categoryVal = mapping.category ? row[parseInt(mapping.category)] : '';
      const notesVal = mapping.notes ? row[parseInt(mapping.notes)] : '';

      if (!dateVal || !friendVal || !hoursVal) {
        validationErrors.push(`Row ${idx + 1}: Missing required fields`);
        return;
      }

      const hours = parseFloat(hoursVal);
      if (isNaN(hours) || hours <= 0) {
        validationErrors.push(`Row ${idx + 1}: Invalid hours value "${hoursVal}"`);
        return;
      }

      previewData.push({
        date: dateVal,
        friend: friendVal,
        hours,
        category: categoryVal,
        notes: notesVal,
      });
    });

    setPreview(previewData);
    setErrors(validationErrors);
  };

  const handleImport = () => {
    setImporting(true);
    const importErrors = [];
    const hangoutsToImport = [];

    // Create lookup maps
    const friendMap = {};
    friends.forEach(f => friendMap[f.name.toLowerCase()] = f.id);
    
    const categoryMap = {};
    categories.forEach(c => categoryMap[c.name.toLowerCase()] = c.id);

    const newFriends = [];
    const newCategories = [];

    csvData.forEach((row, idx) => {
      const dateVal = row[parseInt(mapping.date)]?.trim();
      const friendVal = row[parseInt(mapping.friend)]?.trim();
      const hoursVal = row[parseInt(mapping.hours)];
      const categoryVal = mapping.category ? row[parseInt(mapping.category)]?.trim() : '';
      const notesVal = mapping.notes ? row[parseInt(mapping.notes)]?.trim() : '';

      if (!dateVal || !friendVal || !hoursVal) return;

      const hours = parseFloat(hoursVal);
      if (isNaN(hours) || hours <= 0) {
        importErrors.push(`Row ${idx + 1}: Invalid hours`);
        return;
      }

      // Find or create friend
      let friendId = friendMap[friendVal.toLowerCase()];
      if (!friendId) {
        const newFriend = {
          id: generateId(),
          name: friendVal,
          createdAt: new Date().toISOString(),
        };
        friendMap[friendVal.toLowerCase()] = newFriend.id;
        friendId = newFriend.id;
        newFriends.push(newFriend);
      }

      // Find or create category
      let categoryId = '';
      if (categoryVal) {
        categoryId = categoryMap[categoryVal.toLowerCase()];
        if (!categoryId) {
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
          const newCategory = {
            id: generateId(),
            name: categoryVal,
            color: colors[newCategories.length % colors.length],
          };
          categoryMap[categoryVal.toLowerCase()] = newCategory.id;
          categoryId = newCategory.id;
          newCategories.push(newCategory);
        }
      }

      hangoutsToImport.push({
        id: generateId(),
        date: dateVal,
        friendId,
        hours,
        categoryId,
        notes: notesVal,
      });
    });

    // Add new friends and categories
    newFriends.forEach(f => onAddFriend(f));
    newCategories.forEach(c => onAddCategory(c));

    // Import hangouts
    onImport(hangoutsToImport);

    setImporting(false);
    setImportSuccess(true);
    setErrors(importErrors);

    // Reset after success
    setTimeout(() => {
      setFile(null);
      setCsvData(null);
      setHeaders([]);
      setMapping({ date: '', friend: '', hours: '', category: '', notes: '' });
      setPreview([]);
    }, 2000);
  };

  const reset = () => {
    setFile(null);
    setCsvData(null);
    setHeaders([]);
    setMapping({ date: '', friend: '', hours: '', category: '', notes: '' });
    setPreview([]);
    setErrors([]);
    setImportSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from CSV</CardTitle>
      </CardHeader>
      <CardContent>
        {!file ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Drag and drop a CSV file here, or click to select
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              CSV should have columns for date, friend name, hours, and optionally category and notes
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : importSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">Import Successful!</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Your hangouts have been imported.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">{file.name}</span>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                ({csvData?.length || 0} rows)
              </span>
              <Button variant="ghost" size="sm" onClick={reset} className="ml-auto">
                Remove
              </Button>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Map CSV Columns</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {['date', 'friend', 'hours', 'category', 'notes'].map((field) => (
                  <div key={field}>
                    <Label className="capitalize">
                      {field} {['date', 'friend', 'hours'].includes(field) && '*'}
                    </Label>
                    <Select
                      value={mapping[field]}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                    >
                      <option value="">Select column...</option>
                      {headers.map((header, idx) => (
                        <option key={idx} value={idx}>{header}</option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {errors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Validation Errors</span>
                </div>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {errors.length > 5 && <li>...and {errors.length - 5} more</li>}
                </ul>
              </div>
            )}

            {preview.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Preview (first 5 rows)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-2 text-gray-700 dark:text-gray-300">Date</th>
                        <th className="text-left py-2 px-2 text-gray-700 dark:text-gray-300">Friend</th>
                        <th className="text-left py-2 px-2 text-gray-700 dark:text-gray-300">Hours</th>
                        <th className="text-left py-2 px-2 text-gray-700 dark:text-gray-300">Category</th>
                        <th className="text-left py-2 px-2 text-gray-700 dark:text-gray-300">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.date}</td>
                          <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.friend}</td>
                          <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.hours}</td>
                          <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.category || '-'}</td>
                          <td className="py-2 px-2 truncate max-w-[150px] text-gray-900 dark:text-gray-100">{row.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={validateAndPreview}>
                Validate & Preview
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={preview.length === 0 || importing}
              >
                {importing ? 'Importing...' : `Import ${csvData?.length || 0} Rows`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CSVImport;
