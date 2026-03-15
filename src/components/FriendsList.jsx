import { useState } from 'react';
import { User, Clock, Calendar, Trash2, Edit2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Input, Label } from './ui/Input';
import Modal from './ui/Modal';
import { getLastHangoutDate, getLastSeenText, getTotalHours } from '../utils/helpers';
import Badge from './ui/Badge';

export function FriendsList({ friends, hangouts, groups, onUpdateFriend, onDeleteFriend }) {
  const [editingFriend, setEditingFriend] = useState(null);
  const [editName, setEditName] = useState('');
  const [editGroupIds, setEditGroupIds] = useState([]);

  const getFriendStats = (friendId) => {
    const friendHangouts = hangouts.filter(h => h.friendId === friendId);
    const totalHours = getTotalHours(friendHangouts);
    const lastDate = getLastHangoutDate(friendId, hangouts);
    return { totalHours, lastDate, hangoutCount: friendHangouts.length };
  };

  const handleEdit = (friend) => {
    setEditingFriend(friend);
    setEditName(friend.name);
    setEditGroupIds(friend.groupIds || []);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    onUpdateFriend({ ...editingFriend, name: editName.trim(), groupIds: editGroupIds });
    setEditingFriend(null);
    setEditName('');
    setEditGroupIds([]);
  };

  const toggleGroup = (groupId) => {
    setEditGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getGroupName = (groupId) => groups.find(g => g.id === groupId)?.name || 'Unknown';
  const getGroupColor = (groupId) => groups.find(g => g.id === groupId)?.color || '#6B7280';

  const handleDelete = (friend) => {
    if (confirm(`Are you sure you want to delete ${friend.name}? This will also delete all their hangouts.`)) {
      onDeleteFriend(friend.id);
    }
  };

  const sortedFriends = [...friends].sort((a, b) => {
    const statsA = getFriendStats(a.id);
    const statsB = getFriendStats(b.id);
    return statsB.totalHours - statsA.totalHours;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Friends ({friends.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {friends.length === 0 ? (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500">
              No friends added yet. Add one when logging a hangout!
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {sortedFriends.map((friend) => {
                const stats = getFriendStats(friend.id);
                return (
                  <div 
                    key={friend.id} 
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{friend.name}</h4>
                          {(friend.groupIds || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(friend.groupIds || []).map(gId => (
                                <Badge key={gId} color={getGroupColor(gId)} size="sm">
                                  {getGroupName(gId)}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Last seen: {getLastSeenText(stats.lastDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span>{stats.totalHours.toFixed(1)} hrs</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{stats.hangoutCount} hangouts</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(friend)}
                            className="p-2"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(friend)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
        isOpen={!!editingFriend}
        onClose={() => setEditingFriend(null)}
        title="Edit Friend"
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
            <Label>Groups</Label>
            {groups.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No groups created yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {groups.map(group => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      editGroupIds.includes(group.id)
                        ? 'ring-2 ring-offset-2 ring-blue-500'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ 
                      backgroundColor: group.color + '20', 
                      color: group.color 
                    }}
                  >
                    {group.name}
                    {editGroupIds.includes(group.id) && <X className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingFriend(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default FriendsList;
