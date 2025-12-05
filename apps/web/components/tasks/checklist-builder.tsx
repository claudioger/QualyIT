'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  label: string;
}

interface ChecklistBuilderProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  maxItems?: number;
}

export function ChecklistBuilder({
  items,
  onChange,
  maxItems = 20,
}: ChecklistBuilderProps) {
  const [newItem, setNewItem] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addItem = () => {
    if (newItem.trim() && items.length < maxItems) {
      onChange([...items, { label: newItem.trim() }]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, label: string) => {
    const updated = [...items];
    updated[index] = { label };
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...items];
    const [dragged] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, dragged);
    onChange(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-center gap-2 p-2 bg-muted/50 rounded-lg group transition-all',
                draggedIndex === index && 'opacity-50 scale-95'
              )}
            >
              <button
                type="button"
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground">
                {index + 1}
              </span>
              <Input
                value={item.label}
                onChange={(e) => updateItem(index, e.target.value)}
                className="flex-1 h-8 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Descripción del item..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new item */}
      {items.length < maxItems && (
        <div className="flex items-center gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Agregar item al checklist..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addItem}
            disabled={!newItem.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Item count */}
      <p className="text-xs text-muted-foreground">
        {items.length} de {maxItems} items
      </p>
    </div>
  );
}
