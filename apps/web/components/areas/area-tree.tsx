'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, MoreVertical, Plus, Edit, Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AreaTreeNode } from '@/lib/api/areas';

interface AreaTreeProps {
  areas: AreaTreeNode[];
  onSelect?: (area: AreaTreeNode) => void;
  onEdit?: (area: AreaTreeNode) => void;
  onDelete?: (area: AreaTreeNode) => void;
  onAddChild?: (parentArea: AreaTreeNode) => void;
  onManageUsers?: (area: AreaTreeNode) => void;
  selectedId?: string;
  className?: string;
}

export function AreaTree({
  areas,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  onManageUsers,
  selectedId,
  className,
}: AreaTreeProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {areas.map((area) => (
        <AreaTreeItem
          key={area.id}
          area={area}
          level={0}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onManageUsers={onManageUsers}
          selectedId={selectedId}
        />
      ))}
      {areas.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay áreas creadas</p>
          <p className="text-sm">Crea tu primera área para comenzar</p>
        </div>
      )}
    </div>
  );
}

interface AreaTreeItemProps {
  area: AreaTreeNode;
  level: number;
  onSelect?: (area: AreaTreeNode) => void;
  onEdit?: (area: AreaTreeNode) => void;
  onDelete?: (area: AreaTreeNode) => void;
  onAddChild?: (parentArea: AreaTreeNode) => void;
  onManageUsers?: (area: AreaTreeNode) => void;
  selectedId?: string;
}

function AreaTreeItem({
  area,
  level,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  onManageUsers,
  selectedId,
}: AreaTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = area.children && area.children.length > 0;
  const isSelected = selectedId === area.id;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg transition-colors group',
          'hover:bg-accent cursor-pointer',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${12 + level * 24}px` }}
        onClick={() => onSelect?.(area)}
      >
        {/* Expand/collapse button */}
        <button
          className={cn(
            'w-5 h-5 flex items-center justify-center',
            !hasChildren && 'invisible'
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ))}
        </button>

        {/* Icon */}
        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />

        {/* Name and code */}
        <div className="flex-1 min-w-0">
          <span className="font-medium truncate">{area.name}</span>
          {area.code && (
            <span className="ml-2 text-xs text-muted-foreground">({area.code})</span>
          )}
        </div>

        {/* Responsible */}
        {area.responsible && (
          <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[120px]">
            {area.responsible.name}
          </span>
        )}

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onAddChild && (
              <DropdownMenuItem onClick={() => onAddChild(area)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar sub-área
              </DropdownMenuItem>
            )}
            {onManageUsers && (
              <DropdownMenuItem onClick={() => onManageUsers(area)}>
                <Users className="w-4 h-4 mr-2" />
                Gestionar usuarios
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(area)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(area)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {area.children.map((child) => (
            <AreaTreeItem
              key={child.id}
              area={child as AreaTreeNode}
              level={level + 1}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onManageUsers={onManageUsers}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
