import { useState, useMemo } from 'react';
import { Search, Filter, Download, Trash2, Edit2, ChevronUp, ChevronDown, Plus, X, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Input, Label, Select, Textarea } from './ui/Input';
import Modal from './ui/Modal';
import Badge from './ui/Badge';
import { formatDate, generateId } from '../utils/helpers';
import { cn } from '../utils/cn';

export function ListView({ 
  hangouts, 
  friends, 
  categories, 
  onUpdateHangout, 
  onDeleteHangout,
  onAddHangout
}) {
  const [search, setSearch] = useState('');
  const [filterFriend, setFilterFriend] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editForm, setEditForm] = useState({ participants: [] });

  const getFriendName = (id) => friends.find(f => f.id === id)?.name || 'Unknown';
  const getCategory = (id) => categories.find(c => c.id === id);

  // Group hangouts by groupId (or treat solo hangouts as their own group)
  const groupedHangouts = useMemo(() => {
    const groups = {};
    
    hangouts.forEach(h => {
      const key = h.groupId || h.id; // Use groupId if exists, otherwise use individual id
      if (!groups[key]) {
        groups[key] = {
          groupId: h.groupId,
          date: h.date,
          categoryId: h.categoryId,
          notes: h.notes,
          participants: [],
          isGroup: !!h.groupId
        };
      }
      groups[key].participants.push({
        odId: h.id,
        friendId: h.friendId,
        hours: h.hours
      });
    });

    return Object.entries(groups).map(([key, group]) => ({
      key,
      ...group,
      totalHours: Math.max(...group.participants.map(p => p.hours)),
      friendNames: group.participants.map(p => getFriendName(p.friendId)).join(', ')
    }));
  }, [hangouts, friends]);

  const filteredGroups = useMemo(() => {
    let result = [...groupedHangouts];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(g => {
        const friendNames = g.friendNames.toLowerCase();
        const categoryName = getCategory(g.categoryId)?.name?.toLowerCase() || '';
        const notes = (g.notes || '').toLowerCase();
        return friendNames.includes(searchLower) || 
               categoryName.includes(searchLower) || 
               notes.includes(searchLower);
      });
    }

    if (filterFriend) {
      result = result.filter(g => g.participants.some(p => p.friendId === filterFriend));
    }

    if (filterCategory) {
      result = result.filter(g => g.categoryId === filterCategory);
    }

    if (filterDateFrom) {
      result = result.filter(g => g.date >= filterDateFrom);
    }

    if (filterDateTo) {
      result = result.filter(g => g.date <= filterDateTo);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortField === 'hours') {
        comparison = a.totalHours - b.totalHours;
      } else if (sortField === 'friend') {
        comparison = a.friendNames.localeCompare(b.friendNames);
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [groupedHangouts, search, filterFriend, filterCategory, filterDateFrom, filterDateTo, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setEditForm({
      date: group.date,
      categoryId: group.categoryId,
      notes: group.notes,
      groupId: group.groupId,
      participants: group.participants.map(p => ({
        odId: p.odId,
        friendId: p.friendId,
        hours: p.hours
      }))
    });
  };

  const handleSaveEdit = () => {
    // Update existing participants
    editForm.participants.forEach(p => {
      if (p.odId) {
        // Existing hangout - update it
        onUpdateHangout({
          id: p.odId,
          friendId: p.friendId,
          date: editForm.date,
          categoryId: editForm.categoryId,
          notes: editForm.notes,
          hours: p.hours,
          groupId: editForm.groupId
        });
      } else {
        // New participant - add hangout
        onAddHangout({
          id: generateId(),
          friendId: p.friendId,
          date: editForm.date,
          categoryId: editForm.categoryId,
          notes: editForm.notes,
          hours: p.hours,
          groupId: editForm.groupId || generateId()
        });
      }
    });

    // Find removed participants and delete them
    if (editingGroup) {
      const currentIds = editForm.participants.map(p => p.odId).filter(Boolean);
      editingGroup.participants.forEach(p => {
        if (!currentIds.includes(p.odId)) {
          onDeleteHangout(p.odId);
        }
      });
    }

    setEditingGroup(null);
  };

  const handleDeleteGroup = (group) => {
    const count = group.participants.length;
    const msg = count > 1 
      ? `Are you sure you want to delete this group hangout with ${count} friends?`
      : 'Are you sure you want to delete this hangout?';
    if (confirm(msg)) {
      group.participants.forEach(p => onDeleteHangout(p.odId));
    }
  };

  const addParticipant = (friendId) => {
    if (!friendId || editForm.participants.some(p => p.friendId === friendId)) return;
    setEditForm({
      ...editForm,
      participants: [...editForm.participants, {
        odId: null,
        friendId,
        hours: editForm.participants[0]?.hours || 2
      }]
    });
  };

  const removeParticipant = (friendId) => {
    if (editForm.participants.length <= 1) return;
    setEditForm({
      ...editForm,
      participants: editForm.participants.filter(p => p.friendId !== friendId)
    });
  };

  const updateParticipantHours = (friendId, hours) => {
    setEditForm({
      ...editForm,
      participants: editForm.participants.map(p => 
        p.friendId === friendId ? { ...p, hours: parseFloat(hours) || 0 } : p
      )
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Friends', 'Category', 'Hours', 'Notes'];
    const rows = filteredGroups.map(g => [
      g.date,
      g.friendNames,
      getCategory(g.categoryId)?.name || '',
      g.totalHours,
      g.notes || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hangouts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setFilterFriend('');
    setFilterCategory('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' 
      ? <ChevronUp className="w-4 h-4" /> 
      : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Hangout History ({filteredGroups.length})</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                Filters
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToCSV}
                disabled={filteredGroups.length === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by friend, category, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {showFilters && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label>Friend</Label>
                  <Select 
                    value={filterFriend} 
                    onChange={(e) => setFilterFriend(e.target.value)}
                  >
                    <option value="">All friends</option>
                    {friends.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>From Date</Label>
                  <Input 
                    type="date" 
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label>To Date</Label>
                  <Input 
                    type="date" 
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}

          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              {hangouts.length === 0 
                ? 'No hangouts logged yet' 
                : 'No hangouts match your filters'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th 
                      className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        Date <SortIcon field="date" />
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      onClick={() => handleSort('friend')}
                    >
                      <div className="flex items-center gap-1">
                        Friends <SortIcon field="friend" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Category
                    </th>
                    <th 
                      className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      onClick={() => handleSort('hours')}
                    >
                      <div className="flex items-center gap-1">
                        Hours <SortIcon field="hours" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      Notes
                    </th>
                    <th className="py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((g) => {
                    const category = getCategory(g.categoryId);
                    const isGroupHangout = g.participants.length > 1;
                    return (
                      <tr key={g.key} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">{formatDate(g.date)}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {isGroupHangout && (
                              <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {isGroupHangout ? (
                                <div className="flex flex-wrap gap-1">
                                  {g.participants.map((p, idx) => (
                                    <span key={p.friendId} className="inline-flex items-center">
                                      {getFriendName(p.friendId)}
                                      {p.hours !== g.totalHours && (
                                        <span className="text-xs text-gray-400 ml-1">({p.hours}h)</span>
                                      )}
                                      {idx < g.participants.length - 1 && <span className="text-gray-400">,&nbsp;</span>}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                getFriendName(g.participants[0].friendId)
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge color={category?.color}>{category?.name || 'Unknown'}</Badge>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">{g.totalHours}h</td>
                        <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-[200px] truncate">
                          {g.notes || '-'}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditGroup(g)}
                              className="p-1"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteGroup(g)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        title="Edit Hangout"
      >
        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={editForm.date || ''}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={editForm.categoryId || ''}
              onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              rows={4}
              value={editForm.notes || ''}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="One keyword per line..."
            />
          </div>

          <div>
            <Label>Participants</Label>
            <div className="space-y-2 mt-2">
              {editForm.participants?.map((p) => (
                <div key={p.friendId} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                    {getFriendName(p.friendId)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={p.hours}
                      onChange={(e) => updateParticipantHours(p.friendId, e.target.value)}
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-gray-500">hrs</span>
                  </div>
                  {editForm.participants.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParticipant(p.friendId)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add participant */}
            <div className="mt-3 flex gap-2">
              <Select
                value=""
                onChange={(e) => addParticipant(e.target.value)}
                className="flex-1"
              >
                <option value="">Add a friend...</option>
                {friends
                  .filter(f => !editForm.participants?.some(p => p.friendId === f.id))
                  .map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditingGroup(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default ListView;
