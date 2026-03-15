import { useState } from 'react';
import { Users, Trash2, Edit2, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Input, Label, Select } from './ui/Input';
import Modal from './ui/Modal';
import Badge from './ui/Badge';
import { generateId } from '../utils/helpers';

export function GroupManager({ groups, friends, onAddGroup, onUpdateGroup, onDeleteGroup }) {
  const [editingGroup, setEditingGroup] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#3B82F6');
  const [editCadence, setEditCadence] = useState('');
  const [editExceptions, setEditExceptions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3B82F6');
  const [newGroupCadence, setNewGroupCadence] = useState('');
  const [newGroupExceptions, setNewGroupExceptions] = useState([]);

  const getGroupStats = (groupId) => {
    const groupFriends = friends.filter(f => (f.groupIds || []).includes(groupId));
    return { friendCount: groupFriends.length };
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditColor(group.color);
    setEditCadence(group.cadenceDays ? String(group.cadenceDays) : '');
    setEditExceptions(group.exceptionIds || []);
  };

  const getGroupMembers = (groupId) => {
    return friends.filter(f => (f.groupIds || []).includes(groupId));
  };

  const toggleException = (friendId, isEdit = false) => {
    if (isEdit) {
      setEditExceptions(prev => 
        prev.includes(friendId) 
          ? prev.filter(id => id !== friendId)
          : [...prev, friendId]
      );
    } else {
      setNewGroupExceptions(prev => 
        prev.includes(friendId) 
          ? prev.filter(id => id !== friendId)
          : [...prev, friendId]
      );
    }
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    onUpdateGroup({ 
      ...editingGroup, 
      name: editName.trim(),
      color: editColor,
      cadenceDays: editCadence ? parseInt(editCadence, 10) : null,
      exceptionIds: editExceptions
    });
    setEditingGroup(null);
  };

  const handleDelete = (group) => {
    const stats = getGroupStats(group.id);
    const message = stats.friendCount > 0
      ? `Are you sure you want to delete "${group.name}"? ${stats.friendCount} friend(s) will be removed from this group.`
      : `Are you sure you want to delete "${group.name}"?`;
    if (confirm(message)) {
      onDeleteGroup(group.id);
    }
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    onAddGroup({
      id: generateId(),
      name: newGroupName.trim(),
      color: newGroupColor,
      cadenceDays: newGroupCadence ? parseInt(newGroupCadence, 10) : null,
      exceptionIds: newGroupExceptions,
    });
    setNewGroupName('');
    setNewGroupColor('#3B82F6');
    setNewGroupCadence('');
    setNewGroupExceptions([]);
    setShowAddModal(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Groups ({groups.length})</CardTitle>
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Group
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {groups.length === 0 ? (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500">
              No groups yet. Create one to organize your friends!
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {groups.map((group) => {
                const stats = getGroupStats(group.id);
                return (
                  <div 
                    key={group.id} 
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: group.color + '20' }}
                        >
                          <Users className="w-5 h-5" style={{ color: group.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">{group.name}</h4>
                            <Badge color={group.color}>{stats.friendCount} friends</Badge>
                          </div>
                          {group.cadenceDays && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Remind after {group.cadenceDays} days
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(group)}
                          className="p-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(group)}
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
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Group"
      >
        <div className="space-y-4">
          <div>
            <Label>Group Name</Label>
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g., Dance Team, Family, Work..."
              autoFocus
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newGroupColor}
                onChange={(e) => setNewGroupColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">{newGroupColor}</span>
            </div>
          </div>
          <div>
            <Label>Reminder Cadence (days)</Label>
            <Input
              type="number"
              min="1"
              value={newGroupCadence}
              onChange={(e) => setNewGroupCadence(e.target.value)}
              placeholder="e.g., 14 (leave empty for no reminders)"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Get reminded if you haven't hung out with someone in this group
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGroup}>Add Group</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        title="Edit Group"
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
          <div>
            <Label>Reminder Cadence (days)</Label>
            <Input
              type="number"
              min="1"
              value={editCadence}
              onChange={(e) => setEditCadence(e.target.value)}
              placeholder="e.g., 14 (leave empty for no reminders)"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Get reminded if you haven't hung out with someone in this group
            </p>
          </div>
          {editCadence && editingGroup && (
            <div>
              <Label>Notification Exceptions</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Select people to exclude from catch-up reminders
              </p>
              
              {/* Selected exceptions chips */}
              {editExceptions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {editExceptions.map(id => {
                    const friend = friends.find(f => f.id === id);
                    if (!friend) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full text-sm"
                      >
                        {friend.name}
                        <button
                          type="button"
                          onClick={() => toggleException(id, true)}
                          className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Exception selection dropdown */}
              <Select
                value=""
                onChange={(e) => {
                  if (e.target.value && !editExceptions.includes(e.target.value)) {
                    setEditExceptions([...editExceptions, e.target.value]);
                  }
                }}
              >
                <option value="">Select person to exclude...</option>
                {getGroupMembers(editingGroup.id)
                  .filter(f => !editExceptions.includes(f.id))
                  .map(friend => (
                    <option key={friend.id} value={friend.id}>{friend.name}</option>
                  ))
                }
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingGroup(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default GroupManager;
