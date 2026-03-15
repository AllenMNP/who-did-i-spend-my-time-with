import { useState } from 'react';
import { Tag, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Input, Label } from './ui/Input';
import Modal from './ui/Modal';
import Badge from './ui/Badge';

export function CategoryManager({ categories, hangouts, onUpdateCategory, onDeleteCategory }) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#3B82F6');

  const getCategoryStats = (categoryId) => {
    const categoryHangouts = hangouts.filter(h => h.categoryId === categoryId);
    const totalHours = categoryHangouts.reduce((sum, h) => sum + h.hours, 0);
    return { totalHours, hangoutCount: categoryHangouts.length };
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditColor(category.color);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    onUpdateCategory({ 
      ...editingCategory, 
      name: editName.trim(),
      color: editColor 
    });
    setEditingCategory(null);
  };

  const handleDelete = (category) => {
    const stats = getCategoryStats(category.id);
    if (stats.hangoutCount > 0) {
      alert(`Cannot delete "${category.name}" - it has ${stats.hangoutCount} hangouts associated with it.`);
      return;
    }
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      onDeleteCategory(category.id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500">
              No categories yet. Add one when logging a hangout!
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {categories.map((category) => {
                const stats = getCategoryStats(category.id);
                return (
                  <div 
                    key={category.id} 
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <Tag className="w-5 h-5" style={{ color: category.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">{category.name}</h4>
                            <Badge color={category.color}>{stats.hangoutCount} uses</Badge>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {stats.totalHours.toFixed(1)} total hours
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(category)}
                          className="p-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(category)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Category"
      >
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">{editColor}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default CategoryManager;
