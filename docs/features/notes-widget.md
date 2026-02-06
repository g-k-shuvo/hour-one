# Feature: Notes Widget

## Status: PENDING
**Task Reference**: 4.15 Notes AI

## Objective
Provide a simple note-taking widget with optional AI assistance for summarization, formatting, and idea generation.

## Scope
- Basic markdown note editor
- Multiple notes support
- Search and organization
- AI features (Phase 2)

## Impacted Files
| File | Change |
|------|--------|
| `src/components/widgets/Notes.tsx` | NEW - Notes widget |
| `src/stores/notesStore.ts` | NEW - Notes state |
| `src/components/ui/SettingsSidebar.tsx` | Add notes toggle |
| `src/stores/settingsStore.ts` | Add notes visibility |

## Implementation Details

### NotesStore
```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  tags: string[];
}

interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  addNote: () => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  pinNote: (id: string) => void;
}
```

### UI Features
- Note list sidebar
- Markdown editor
- Auto-save on change
- Search notes
- Pin important notes
- Tag organization

### AI Features (Future)
- Summarize long notes
- Format messy text
- Generate ideas from prompt
- Extract action items

## Data Model
```typescript
// Chrome Storage
{
  notes: {
    notes: Note[];
    activeNoteId: string | null;
  }
}
```

## Test Plan
- [ ] Create new note
- [ ] Edit and auto-save
- [ ] Delete note
- [ ] Search works
- [ ] Pin/unpin works
- [ ] Notes persist

## Rollout
1. Create basic store
2. Build note list UI
3. Add markdown editor
4. Implement search
5. Add pinning and tags
6. (Future) Add AI features
