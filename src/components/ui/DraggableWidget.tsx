import { useState, useRef, type ReactNode, type DragEvent } from 'react';
import { GripVertical } from 'lucide-react';
import type { CenterWidgetId } from '@/stores/layoutStore';

interface DraggableWidgetProps {
  id: CenterWidgetId;
  index: number;
  children: ReactNode;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
  className?: string;
}

export function DraggableWidget({
  id,
  index,
  children,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
  className = '',
}: DraggableWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());

    // Set a custom drag image (optional - makes it look nicer)
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      e.dataTransfer.setDragImage(dragRef.current, rect.width / 2, rect.height / 2);
    }

    onDragStart(index);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(index);
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  const isBeingDraggedOver = dragOverIndex === index && isDragging;
  const isCurrentlyDragging = isDragging && dragOverIndex !== null;

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group/drag transition-all duration-200
        ${isCurrentlyDragging ? 'opacity-50' : ''}
        ${isBeingDraggedOver ? 'scale-105' : ''}
        ${className}
      `}
      data-widget-id={id}
    >
      {/* Drag Handle - appears on hover */}
      <div
        className={`
          absolute -left-8 top-1/2 -translate-y-1/2
          flex items-center justify-center
          w-6 h-8 rounded-md cursor-grab active:cursor-grabbing
          transition-opacity duration-200
          ${isHovered ? 'opacity-60 hover:opacity-100' : 'opacity-0'}
          hover:bg-white/10
        `}
        title="Drag to reorder"
      >
        <GripVertical size={16} className="text-white/60" />
      </div>

      {/* Drop indicator line */}
      {isBeingDraggedOver && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-accent rounded-full animate-pulse" />
      )}

      {/* Widget content */}
      {children}
    </div>
  );
}

export function useDragReorder(onReorder: (fromIndex: number, toIndex: number) => void) {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragIndex: number | null;
    dragOverIndex: number | null;
  }>({
    isDragging: false,
    dragIndex: null,
    dragOverIndex: null,
  });

  const handleDragStart = (index: number) => {
    setDragState({
      isDragging: true,
      dragIndex: index,
      dragOverIndex: null,
    });
  };

  const handleDragOver = (index: number) => {
    if (dragState.dragIndex !== null && dragState.dragIndex !== index) {
      setDragState((prev) => ({
        ...prev,
        dragOverIndex: index,
      }));
    }
  };

  const handleDragEnd = () => {
    if (dragState.dragIndex !== null && dragState.dragOverIndex !== null) {
      onReorder(dragState.dragIndex, dragState.dragOverIndex);
    }
    setDragState({
      isDragging: false,
      dragIndex: null,
      dragOverIndex: null,
    });
  };

  return {
    ...dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
