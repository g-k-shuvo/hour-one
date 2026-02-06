# Feature: Vision Board

## Status: PENDING
**Task Reference**: 4.1 Vision Board

## Objective
Allow users to upload custom images and create a personal vision board for motivation and goal visualization.

## Scope
- Image upload and storage
- Vision board layout/grid
- Image positioning and sizing
- Caption/label support
- Export/share functionality

## Impacted Files
| File | Change |
|------|--------|
| `src/components/widgets/VisionBoard.tsx` | NEW - Vision board widget |
| `src/stores/visionBoardStore.ts` | NEW - Vision board state |
| `src/components/ui/SettingsSidebar.tsx` | Add vision board toggle |
| `src/stores/settingsStore.ts` | Add vision board visibility |

## Implementation Details

### VisionBoardStore
```typescript
interface VisionItem {
  id: string;
  imageData: string; // Base64 or blob URL
  caption?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  createdAt: string;
}

interface VisionBoardState {
  items: VisionItem[];
  layout: 'grid' | 'freeform';
  addItem: (file: File) => Promise<void>;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<VisionItem>) => void;
}
```

### Image Storage
- Convert to base64 for Chrome storage
- Compress images to reduce storage usage
- Max 10 images (storage limit consideration)

### UI Features
- Drag and drop upload
- Click to add caption
- Resize handles
- Delete button on hover

## Data Model
```typescript
// Chrome Storage
{
  visionBoard: {
    items: VisionItem[];
    layout: 'grid' | 'freeform';
  }
}
```

## Test Plan
- [ ] Image upload works
- [ ] Images persist across sessions
- [ ] Captions can be added/edited
- [ ] Items can be repositioned
- [ ] Delete removes item

## Rollout
1. Create store with basic CRUD
2. Build upload UI
3. Implement grid layout
4. Add freeform positioning
5. Add captions
