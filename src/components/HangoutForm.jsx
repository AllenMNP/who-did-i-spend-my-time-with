import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Button from './ui/Button';
import { Input, Label, Select, Textarea } from './ui/Input';
import DatePicker from './ui/DatePicker';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Modal from './ui/Modal';
import { generateId } from '../utils/helpers';
import { cn } from '../utils/cn';

const DURATION_PRESETS = [
  { label: '1 hr', value: 1 },
  { label: '2 hr', value: 2 },
  { label: '3 hr', value: 3 },
  { label: '4+ hr', value: 4 },
];

export function HangoutForm({ 
  friends, 
  categories,
  groups,
  onAddHangout, 
  onAddFriend, 
  onAddCategory,
  onComplete
}) {
  const [formData, setFormData] = useState({
    friendIds: [],
    date: '',
    hours: 2,
    categoryId: '',
    notes: '',
  });
  const [customHours, setCustomHours] = useState('');
  const [useCustomHours, setUseCustomHours] = useState(false);
  const [showNewFriendModal, setShowNewFriendModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendGroupIds, setNewFriendGroupIds] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.friendIds.length === 0 || !formData.categoryId || !formData.date) {
      alert('Please select at least one friend, a date, and a category');
      return;
    }

    const hours = useCustomHours ? parseFloat(customHours) : formData.hours;
    if (!hours || hours <= 0) {
      alert('Please enter valid hours');
      return;
    }

    // Create a hangout entry for each selected friend with a shared groupId
    const groupId = formData.friendIds.length > 1 ? generateId() : null;
    
    formData.friendIds.forEach(friendId => {
      onAddHangout({
        id: generateId(),
        friendId,
        date: formData.date,
        categoryId: formData.categoryId,
        notes: formData.notes,
        hours,
        groupId, // Links hangouts that happened together
      });
    });

    setFormData({
      friendIds: [],
      date: new Date().toISOString().split('T')[0],
      hours: 2,
      categoryId: '',
      notes: '',
    });
    setCustomHours('');
    setUseCustomHours(false);
    
    if (onComplete) {
      onComplete();
    }
  };

  const toggleFriend = (friendId) => {
    setFormData(prev => ({
      ...prev,
      friendIds: prev.friendIds.includes(friendId)
        ? prev.friendIds.filter(id => id !== friendId)
        : [...prev.friendIds, friendId]
    }));
  };

  const removeFriend = (friendId) => {
    setFormData(prev => ({
      ...prev,
      friendIds: prev.friendIds.filter(id => id !== friendId)
    }));
  };

  const getFriendName = (id) => friends.find(f => f.id === id)?.name || 'Unknown';

  const handleAddFriend = () => {
    if (!newFriendName.trim()) return;
    const newId = generateId();
    onAddFriend({
      id: newId,
      name: newFriendName.trim(),
      groupIds: newFriendGroupIds,
      createdAt: new Date().toISOString(),
    });
    // Auto-select the new friend
    setFormData(prev => ({
      ...prev,
      friendIds: [...prev.friendIds, newId]
    }));
    setNewFriendName('');
    setNewFriendGroupIds([]);
    setShowNewFriendModal(false);
  };

  const toggleNewFriendGroup = (groupId) => {
    setNewFriendGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    onAddCategory({
      id: generateId(),
      name: newCategoryName.trim(),
      color: newCategoryColor,
    });
    setNewCategoryName('');
    setNewCategoryColor('#3B82F6');
    setShowNewCategoryModal(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Log a Hangout</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Friends {formData.friendIds.length > 0 && `(${formData.friendIds.length} selected)`}</Label>
              
              {/* Selected friends chips */}
              {formData.friendIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.friendIds.map(id => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                    >
                      {getFriendName(id)}
                      <button
                        type="button"
                        onClick={() => removeFriend(id)}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Friend selection dropdown */}
              <div className="flex gap-2">
                <Select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !formData.friendIds.includes(e.target.value)) {
                      setFormData({ ...formData, friendIds: [...formData.friendIds, e.target.value] });
                    }
                  }}
                  className="flex-1"
                >
                  <option value="">Select friends...</option>
                  {friends.filter(f => !formData.friendIds.includes(f.id)).map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewFriendModal(true)}
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Date</Label>
              <DatePicker
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
              />
            </div>

            <div>
              <Label>Duration</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {DURATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={!useCustomHours && formData.hours === preset.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, hours: preset.value });
                      setUseCustomHours(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={useCustomHours ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setUseCustomHours(true)}
                >
                  Custom
                </Button>
              </div>
              {useCustomHours && (
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="Enter hours (e.g., 1.5)"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label>Category</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="flex-1"
                >
                  <option value="">Select a category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewCategoryModal(true)}
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                rows={3}
                placeholder="What did you do?"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full">
              Log Hangout
            </Button>
          </form>
        </CardContent>
      </Card>

      <Modal
        isOpen={showNewFriendModal}
        onClose={() => setShowNewFriendModal(false)}
        title="Add New Friend"
      >
        <div className="space-y-4">
          <div>
            <Label>Friend's Name</Label>
            <Input
              value={newFriendName}
              onChange={(e) => setNewFriendName(e.target.value)}
              placeholder="Enter name..."
              autoFocus
            />
          </div>
          {groups && groups.length > 0 && (
            <div>
              <Label>Groups (optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {groups.map(group => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleNewFriendGroup(group.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      newFriendGroupIds.includes(group.id)
                        ? 'ring-2 ring-offset-2 ring-blue-500'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ 
                      backgroundColor: group.color + '20', 
                      color: group.color 
                    }}
                  >
                    {group.name}
                    {newFriendGroupIds.includes(group.id) && <X className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewFriendModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFriend}>Add Friend</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showNewCategoryModal}
        onClose={() => setShowNewCategoryModal(false)}
        title="Add New Category"
      >
        <div className="space-y-4">
          <div>
            <Label>Category Name</Label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Dinner, Gaming, Hiking..."
              autoFocus
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">{newCategoryColor}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewCategoryModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Add Category</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default HangoutForm;
