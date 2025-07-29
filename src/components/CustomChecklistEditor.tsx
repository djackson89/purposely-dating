import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CustomChecklistItem {
  id: string;
  item_name: string;
  is_default: boolean;
}

interface CustomChecklistEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const CustomChecklistEditor: React.FC<CustomChecklistEditorProps> = ({
  isOpen,
  onClose,
  onUpdate
}) => {
  const { user } = useAuth();
  const [checklistItems, setChecklistItems] = useState<CustomChecklistItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load existing checklist items
  useEffect(() => {
    if (isOpen && user) {
      loadChecklistItems();
    }
  }, [isOpen, user]);

  const loadChecklistItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('custom_checklist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('item_name');

      if (error) throw error;

      setChecklistItems(data || []);
    } catch (error) {
      console.error('Error loading checklist items:', error);
      toast.error('Failed to load checklist items');
    }
  };

  const addNewItem = async () => {
    if (!newItemName.trim() || !user) {
      toast.error('Please enter an item name');
      return;
    }

    // Check if item already exists
    if (checklistItems.some(item => item.item_name.toLowerCase() === newItemName.toLowerCase())) {
      toast.error('This item already exists');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_checklist_items')
        .insert({
          user_id: user.id,
          item_name: newItemName.trim(),
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;

      setChecklistItems([...checklistItems, data]);
      setNewItemName('');
      toast.success('Item added successfully!');
    } catch (error) {
      console.error('Error adding checklist item:', error);
      toast.error('Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (itemId: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error('Cannot delete default items');
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_checklist_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      setChecklistItems(checklistItems.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleSave = () => {
    onUpdate();
    onClose();
    toast.success('Checklist updated successfully!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Preparation Checklist</span>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Items */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Current Checklist Items</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border border-border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={true} 
                      disabled 
                      className="opacity-50"
                    />
                    <span className="text-sm">{item.item_name}</span>
                    {item.is_default && (
                      <span className="text-xs text-muted-foreground">(Default)</span>
                    )}
                  </div>
                  {!item.is_default && (
                    <Button
                      onClick={() => deleteItem(item.id, item.is_default)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add New Item */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Add New Item</Label>
            <div className="flex space-x-2">
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g., Time Off Work, Dress Code Check"
                onKeyPress={(e) => e.key === 'Enter' && addNewItem()}
              />
              <Button
                onClick={addNewItem}
                disabled={isLoading || !newItemName.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Suggestions:</p>
            <p>Time Off Work, Dress Code Check, Transportation, Backup Plan, Emergency Contact, Gift/Flowers, Camera/Phone Charged</p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline" size="sm">
              Cancel
            </Button>
            <Button onClick={handleSave} size="sm">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomChecklistEditor;