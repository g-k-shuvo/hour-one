import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Pencil,
  ExternalLink,
  Pin,
  PinOff,
  Trash2,
  FolderPlus,
  LayoutGrid,
  List,
  Settings,
  MoreVertical,
  Link as LinkIcon,
  ArrowLeft,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { useQuickLinksStore } from '@/stores/quickLinksStore';
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
  DropdownContainer,
  AdaptiveDropdown,
} from '@/components/ui/Dropdown';
import type { QuickLink, LinkGroup } from '@/types';

interface QuickLinksProps {
  onOpenSettings?: () => void;
}

type FormView =
  | { type: 'list' }
  | { type: 'add-link'; groupId?: string }
  | { type: 'add-group' }
  | { type: 'edit-link'; linkId: string }
  | { type: 'edit-group'; groupId: string };

type DeleteConfirm =
  | { type: 'link'; id: string }
  | { type: 'group'; id: string; linkCount: number }
  | null;

export function QuickLinks(_props: QuickLinksProps) {
  const {
    links,
    groups,
    viewMode,
    addLink,
    updateLink,
    deleteLink,
    addGroup,
    updateGroup,
    deleteGroup,
    pinLink,
    unpinLink,
    pinGroup,
    unpinGroup,
  } = useQuickLinksStore();

  const [formView, setFormView] = useState<FormView>({ type: 'list' });
  const [confirmingDelete, setConfirmingDelete] = useState<DeleteConfirm>(null);

  // Auto-cancel delete confirmation after 5 seconds
  useEffect(() => {
    if (confirmingDelete) {
      const timer = setTimeout(() => setConfirmingDelete(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [confirmingDelete]);

  // Organize links by group
  const ungroupedLinks = links.filter((link) => !link.groupId);
  const linksByGroup = groups.map((group) => ({
    group,
    links: links.filter((link) => link.groupId === group.id),
  }));

  const isEmpty = links.length === 0 && groups.length === 0;

  // Count pinned items
  const pinnedCount =
    links.filter((l) => l.pinned).length +
    groups.filter((g) => g.pinned).length;
  const canPin = pinnedCount < 5;

  // Handle delete with confirmation
  const handleDeleteLink = (linkId: string) => {
    if (confirmingDelete?.type === 'link' && confirmingDelete.id === linkId) {
      deleteLink(linkId);
      setConfirmingDelete(null);
    } else {
      setConfirmingDelete({ type: 'link', id: linkId });
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const linkCount = links.filter((l) => l.groupId === groupId).length;

    if (confirmingDelete?.type === 'group' && confirmingDelete.id === groupId) {
      deleteGroup(groupId);
      setConfirmingDelete(null);
    } else {
      setConfirmingDelete({ type: 'group', id: groupId, linkCount });
    }
  };

  // Render Add Link Form view
  if (formView.type === 'add-link') {
    return (
      <AddLinkFormView
        groupId={formView.groupId}
        groups={groups}
        canPin={canPin}
        onAdd={(name, url, groupId, pinned) => {
          addLink(name, url, groupId, pinned);
          setFormView({ type: 'list' });
        }}
        onBack={() => setFormView({ type: 'list' })}
      />
    );
  }

  // Render Add Group Form view
  if (formView.type === 'add-group') {
    return (
      <AddGroupFormView
        onAdd={(name) => {
          addGroup(name);
          setFormView({ type: 'list' });
        }}
        onBack={() => setFormView({ type: 'list' })}
      />
    );
  }

  // Render Edit Link Form view
  if (formView.type === 'edit-link') {
    const link = links.find((l) => l.id === formView.linkId);
    if (!link) {
      setFormView({ type: 'list' });
      return null;
    }
    return (
      <EditLinkFormView
        link={link}
        groups={groups}
        canPin={canPin}
        onSave={(updates) => {
          updateLink(link.id, updates);
          setFormView({ type: 'list' });
        }}
        onDelete={() => {
          deleteLink(link.id);
          setFormView({ type: 'list' });
        }}
        onBack={() => setFormView({ type: 'list' })}
        onPin={() => (link.pinned ? unpinLink(link.id) : pinLink(link.id))}
      />
    );
  }

  // Render Edit Group Form view
  if (formView.type === 'edit-group') {
    const group = groups.find((g) => g.id === formView.groupId);
    if (!group) {
      setFormView({ type: 'list' });
      return null;
    }
    const linkCount = links.filter((l) => l.groupId === group.id).length;
    return (
      <EditGroupFormView
        group={group}
        linkCount={linkCount}
        canPin={canPin}
        onSave={(name) => {
          updateGroup(group.id, { name });
          setFormView({ type: 'list' });
        }}
        onDelete={() => {
          deleteGroup(group.id);
          setFormView({ type: 'list' });
        }}
        onBack={() => setFormView({ type: 'list' })}
        onPin={() => (group.pinned ? unpinGroup(group.id) : pinGroup(group.id))}
      />
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 rounded-full bg-white/10 p-3">
          <LinkIcon size={24} className="text-white/40" />
        </div>
        <p className="mb-1 text-sm font-medium text-white/70">No links yet</p>
        <p className="mb-4 text-xs text-white/40">
          Add your favorite sites to get started
        </p>
        <button
          onClick={() => setFormView({ type: 'add-link' })}
          className="flex items-center gap-1.5 rounded-lg bg-primary-500/80 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500"
        >
          <Plus size={16} />
          Add Link
        </button>
      </div>
    );
  }

  // List view
  return (
    <div>
      {/* Action buttons */}
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setFormView({ type: 'add-link' })}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 py-2 text-xs text-white/50 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-white/70"
        >
          <Plus size={14} />
          Add Link
        </button>
        <button
          onClick={() => setFormView({ type: 'add-group' })}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 py-2 text-xs text-white/50 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-white/70"
        >
          <FolderPlus size={14} />
          Add Group
        </button>
      </div>

      {/* Scrollable content */}
      <div className="max-h-60 overflow-y-auto scrollbar-thin">
        {/* Groups with their links */}
        {linksByGroup.map(({ group, links: groupLinks }) => (
        <div key={group.id} className="mb-4">
          <GroupHeader
            group={group}
            groupLinks={groupLinks}
            onEdit={() => setFormView({ type: 'edit-group', groupId: group.id })}
            onDelete={() => handleDeleteGroup(group.id)}
            onPin={() =>
              group.pinned ? unpinGroup(group.id) : pinGroup(group.id)
            }
            isPinned={!!group.pinned}
            canPin={canPin}
            onAddLink={() => setFormView({ type: 'add-link', groupId: group.id })}
            isConfirmingDelete={
              confirmingDelete?.type === 'group' &&
              confirmingDelete.id === group.id
            }
            confirmLinkCount={
              confirmingDelete?.type === 'group' &&
              confirmingDelete.id === group.id
                ? confirmingDelete.linkCount
                : 0
            }
            onCancelDelete={() => setConfirmingDelete(null)}
          />

          {/* Links in this group */}
          <div
            className={
              viewMode === 'tile' ? 'grid grid-cols-4 gap-2' : 'space-y-1'
            }
          >
            {groupLinks.map((link) => (
              <LinkItem
                key={link.id}
                link={link}
                viewMode={viewMode}
                onEdit={() => setFormView({ type: 'edit-link', linkId: link.id })}
                onPin={() =>
                  link.pinned ? unpinLink(link.id) : pinLink(link.id)
                }
                onDelete={() => handleDeleteLink(link.id)}
                canPin={canPin}
                isConfirmingDelete={
                  confirmingDelete?.type === 'link' &&
                  confirmingDelete.id === link.id
                }
                onCancelDelete={() => setConfirmingDelete(null)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Ungrouped links */}
      {ungroupedLinks.length > 0 && (
        <div className="mb-4">
          {groups.length > 0 && (
            <div className="mb-2 flex items-center gap-2">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] uppercase tracking-wider text-white/30">
                Ungrouped
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          )}

          <div
            className={
              viewMode === 'tile' ? 'grid grid-cols-4 gap-2' : 'space-y-1'
            }
          >
            {ungroupedLinks.map((link) => (
              <LinkItem
                key={link.id}
                link={link}
                viewMode={viewMode}
                onEdit={() => setFormView({ type: 'edit-link', linkId: link.id })}
                onPin={() =>
                  link.pinned ? unpinLink(link.id) : pinLink(link.id)
                }
                onDelete={() => handleDeleteLink(link.id)}
                canPin={canPin}
                isConfirmingDelete={
                  confirmingDelete?.type === 'link' &&
                  confirmingDelete.id === link.id
                }
                onCancelDelete={() => setConfirmingDelete(null)}
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// Header Actions component for PopupPanel
export function QuickLinksHeaderActions({
  onClose,
}: {
  onClose?: () => void;
}) {
  const { viewMode, setViewMode } = useQuickLinksStore();

  const handleOpenSettings = () => {
    // Close the popup first
    onClose?.();
    // Then open settings
    window.dispatchEvent(
      new CustomEvent('openSettings', { detail: { section: 'links' } })
    );
  };

  return (
    <>
      <button
        onClick={() => setViewMode(viewMode === 'tile' ? 'list' : 'tile')}
        className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
        aria-label={viewMode === 'tile' ? 'Switch to list view' : 'Switch to tile view'}
        title={viewMode === 'tile' ? 'List view' : 'Tile view'}
      >
        {viewMode === 'tile' ? <List size={16} /> : <LayoutGrid size={16} />}
      </button>
      <button
        onClick={handleOpenSettings}
        className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
        aria-label="Open settings"
        title="Settings"
      >
        <Settings size={16} />
      </button>
    </>
  );
}

// Group Header Component
interface GroupHeaderProps {
  group: LinkGroup;
  groupLinks: QuickLink[];
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  isPinned: boolean;
  canPin: boolean;
  onAddLink: () => void;
  isConfirmingDelete?: boolean;
  confirmLinkCount?: number;
  onCancelDelete?: () => void;
}

function GroupHeader({
  group,
  groupLinks,
  onEdit,
  onDelete,
  onPin,
  isPinned,
  canPin,
  onAddLink,
  isConfirmingDelete,
  confirmLinkCount,
  onCancelDelete,
}: GroupHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpenAll = () => {
    groupLinks.forEach((link) => {
      window.open(link.url, '_blank');
    });
  };

  // Show delete confirmation
  if (isConfirmingDelete) {
    return (
      <div className="mb-2 rounded-lg bg-red-500/10 p-3">
        <p className="mb-2 text-xs text-white/70">
          Delete '{group.name}'?
          {confirmLinkCount && confirmLinkCount > 0 && (
            <span className="text-red-400">
              {' '}
              {confirmLinkCount} link{confirmLinkCount > 1 ? 's' : ''} will become
              ungrouped.
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancelDelete}
            className="flex-1 rounded px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="flex-1 rounded bg-red-500/80 px-2 py-1 text-xs text-white transition-colors hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group/header mb-2 flex items-center gap-2">
      <div
        className="h-px flex-1"
        style={{ backgroundColor: group.color || 'rgba(255,255,255,0.2)' }}
      />
      <div className="relative flex items-center gap-1">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: group.color || 'rgba(255,255,255,0.5)' }}
        >
          {group.name}
        </span>
        {groupLinks.length > 0 && (
          <button
            onClick={handleOpenAll}
            className="rounded p-1 text-white/40 transition-all hover:bg-white/10 hover:text-white/70"
            title={`Open all ${groupLinks.length} links in new tabs`}
          >
            <ExternalLink size={14} />
          </button>
        )}
        {isPinned && <Pin size={10} className="text-white/40" />}

        {/* Actions */}
        <DropdownContainer
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          className="relative"
        >
          <button
            ref={triggerRef}
            onClick={() => setShowMenu(!showMenu)}
            className="ml-1 rounded p-0.5 text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white/60 group-hover/header:opacity-100"
          >
            <MoreVertical size={12} />
          </button>

          <AdaptiveDropdown triggerRef={triggerRef} isOpen={showMenu} width="w-32" preferredPosition="right">
            {groupLinks.length > 0 && (
              <>
                <DropdownItem onClick={() => { handleOpenAll(); setShowMenu(false); }}>
                  <ExternalLink size={12} />
                  Open All
                </DropdownItem>
                <DropdownDivider />
              </>
            )}
            <DropdownItem onClick={onAddLink}>
              <Plus size={12} />
              Add Link
            </DropdownItem>
            <DropdownItem onClick={onEdit}>
              <Pencil size={12} />
              Edit
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                onPin();
                setShowMenu(false);
              }}
              className={!canPin && !isPinned ? 'opacity-50' : ''}
            >
              {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
              {isPinned ? 'Unpin' : 'Pin'}
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              onClick={() => {
                setShowMenu(false);
                onDelete();
              }}
              className="text-red-400"
            >
              <Trash2 size={12} />
              Delete
            </DropdownItem>
          </AdaptiveDropdown>
        </DropdownContainer>
      </div>
      <div
        className="h-px flex-1"
        style={{ backgroundColor: group.color || 'rgba(255,255,255,0.2)' }}
      />
    </div>
  );
}

// Link Item Component
interface LinkItemProps {
  link: QuickLink;
  viewMode: 'tile' | 'list';
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
  canPin: boolean;
  isConfirmingDelete?: boolean;
  onCancelDelete?: () => void;
}

function LinkItem({
  link,
  viewMode,
  onEdit,
  onPin,
  onDelete,
  canPin,
  isConfirmingDelete,
  onCancelDelete,
}: LinkItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Show delete confirmation inline
  if (isConfirmingDelete) {
    return (
      <div
        className={`rounded-lg bg-red-500/10 p-3 ${
          viewMode === 'tile' ? 'col-span-4' : ''
        }`}
      >
        <p className="mb-2 text-xs text-white/70">Delete this link?</p>
        <div className="flex gap-2">
          <button
            onClick={onCancelDelete}
            className="flex-1 rounded px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="flex-1 rounded bg-red-500/80 px-2 py-1 text-xs text-white transition-colors hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div
        className="group/item flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-white/5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center gap-2 min-w-0"
        >
          {link.icon ? (
            <img
              src={link.icon}
              alt=""
              className="h-4 w-4 rounded flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <ExternalLink size={16} className="text-white/60 flex-shrink-0" />
          )}
          <span className="truncate text-sm text-white/80">{link.name}</span>
          <span className="truncate text-xs text-white/30 flex-1">
            {new URL(link.url).hostname}
          </span>
        </a>

        {/* Pin indicator */}
        {link.pinned && !isHovered && (
          <Pin size={12} className="text-white/40 flex-shrink-0" />
        )}

        {/* Actions */}
        {isHovered && (
          <DropdownContainer
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
            className="relative flex-shrink-0"
          >
            <button
              ref={triggerRef}
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white/60"
            >
              <MoreVertical size={14} />
            </button>

            <AdaptiveDropdown triggerRef={triggerRef} isOpen={showMenu} width="w-28" preferredPosition="right">
              <DropdownItem onClick={onEdit}>
                <Pencil size={12} />
                Edit
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  onPin();
                  setShowMenu(false);
                }}
                className={!canPin && !link.pinned ? 'opacity-50' : ''}
              >
                {link.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                {link.pinned ? 'Unpin' : 'Pin'}
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                onClick={() => {
                  setShowMenu(false);
                  onDelete();
                }}
                className="text-red-400"
              >
                <Trash2 size={12} />
                Delete
              </DropdownItem>
            </AdaptiveDropdown>
          </DropdownContainer>
        )}
      </div>
    );
  }

  // Tile view
  return (
    <div
      className="group/item relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-full flex-col items-center justify-center gap-1 rounded-lg bg-white/5 p-2 transition-all hover:bg-white/10"
        title={link.url}
      >
        {link.icon ? (
          <img
            src={link.icon}
            alt=""
            className="h-6 w-6 rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <ExternalLink size={20} className="text-white/60" />
        )}
        <span className="max-w-full truncate text-xs text-white/70">
          {link.name}
        </span>
      </a>

      {/* Pin indicator */}
      {link.pinned && !isHovered && (
        <div className="absolute -right-0.5 -top-0.5">
          <Pin size={10} className="text-white/50" />
        </div>
      )}

      {/* Actions on hover */}
      {isHovered && (
        <DropdownContainer
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          className="absolute -right-1 -top-1"
        >
          <button
            ref={triggerRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-full bg-white/20 p-1 text-white/70 transition-colors hover:bg-white/30 hover:text-white"
          >
            <MoreVertical size={10} />
          </button>

          <AdaptiveDropdown triggerRef={triggerRef} isOpen={showMenu} width="w-28" preferredPosition="right">
            <DropdownItem onClick={onEdit}>
              <Pencil size={12} />
              Edit
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                onPin();
                setShowMenu(false);
              }}
              className={!canPin && !link.pinned ? 'opacity-50' : ''}
            >
              {link.pinned ? <PinOff size={12} /> : <Pin size={12} />}
              {link.pinned ? 'Unpin' : 'Pin'}
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              onClick={() => {
                setShowMenu(false);
                onDelete();
              }}
              className="text-red-400"
            >
              <Trash2 size={12} />
              Delete
            </DropdownItem>
          </AdaptiveDropdown>
        </DropdownContainer>
      )}
    </div>
  );
}

// Momentum-style Add Link Form View
interface AddLinkFormViewProps {
  groupId?: string;
  groups: LinkGroup[];
  canPin: boolean;
  onAdd: (name: string, url: string, groupId?: string, pinned?: boolean) => void;
  onBack: () => void;
}

function AddLinkFormView({
  groupId: initialGroupId,
  groups,
  canPin,
  onAdd,
  onBack,
}: AddLinkFormViewProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState(initialGroupId || '');
  const [pinned, setPinned] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const groupTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    urlInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAdd(name, url, groupId || undefined, pinned);
    }
  };

  const selectedGroup = groups.find((g) => g.id === groupId);

  return (
    <div>
      {/* Header with back arrow */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-white/60 transition-colors hover:text-white/80"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">Creating a link</span>
      </button>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* URL Field */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/50">
            URL
          </label>
          <div className="relative">
            <Globe
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30"
            />
          </div>
        </div>

        {/* Title Field */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Title{' '}
            <span className="font-normal text-white/30">(optional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Link"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30"
          />
        </div>

        {/* Group Dropdown (if groups exist) */}
        {groups.length > 0 && (
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Group{' '}
              <span className="font-normal text-white/30">(optional)</span>
            </label>
            <DropdownContainer
              isOpen={showGroupDropdown}
              onClose={() => setShowGroupDropdown(false)}
              className="relative"
            >
              <button
                ref={groupTriggerRef}
                type="button"
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 outline-none transition-colors hover:border-white/20 focus:border-white/30"
              >
                <span>{selectedGroup?.name || 'Select group...'}</span>
                <ChevronDown size={16} className="text-white/40" />
              </button>

              <AdaptiveDropdown triggerRef={groupTriggerRef} isOpen={showGroupDropdown} width="w-full" preferredPosition="left">
                <DropdownItem
                  onClick={() => {
                    setGroupId('');
                    setShowGroupDropdown(false);
                  }}
                >
                  No group
                </DropdownItem>
                <DropdownDivider />
                {groups.map((g) => (
                  <DropdownItem
                    key={g.id}
                    onClick={() => {
                      setGroupId(g.id);
                      setShowGroupDropdown(false);
                    }}
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: g.color || '#888' }}
                    />
                    {g.name}
                  </DropdownItem>
                ))}
              </AdaptiveDropdown>
            </DropdownContainer>
          </div>
        )}

        {/* Pin to Dashboard Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-sm text-white/70">Pin to Dashboard</span>
          <button
            type="button"
            onClick={() => canPin && setPinned(!pinned)}
            disabled={!canPin && !pinned}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              pinned ? 'bg-primary-500' : 'bg-white/20'
            } ${!canPin && !pinned ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                pinned ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!url.trim()}
          className="w-full rounded-lg bg-primary-500/80 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add Link
        </button>
      </form>
    </div>
  );
}

// Momentum-style Add Group Form View
interface AddGroupFormViewProps {
  onAdd: (name: string) => void;
  onBack: () => void;
}

function AddGroupFormView({ onAdd, onBack }: AddGroupFormViewProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name);
    }
  };

  return (
    <div>
      {/* Header with back arrow */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-white/60 transition-colors hover:text-white/80"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">Creating a group</span>
      </button>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name Field */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Work, Personal, etc."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full rounded-lg bg-primary-500/80 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create Group
        </button>
      </form>
    </div>
  );
}

// Momentum-style Edit Link Form View
interface EditLinkFormViewProps {
  link: QuickLink;
  groups: LinkGroup[];
  canPin: boolean;
  onSave: (updates: Partial<QuickLink>) => void;
  onDelete: () => void;
  onBack: () => void;
  onPin: () => void;
}

function EditLinkFormView({
  link,
  groups,
  canPin,
  onSave,
  onDelete,
  onBack,
  onPin,
}: EditLinkFormViewProps) {
  const [url, setUrl] = useState(link.url);
  const [name, setName] = useState(link.name);
  const [groupId, setGroupId] = useState(link.groupId || '');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const groupTriggerRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSave({
        name: name.trim(),
        url: url.trim(),
        groupId: groupId || undefined,
      });
    }
  };

  const selectedGroup = groups.find((g) => g.id === groupId);

  return (
    <div>
      {/* Header with back arrow */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-white/60 transition-colors hover:text-white/80"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">Editing link</span>
      </button>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* URL Field */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/50">
            URL
          </label>
          <div className="relative">
            <Globe
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30"
            />
          </div>
        </div>

        {/* Title Field */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Title
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Link"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30"
          />
        </div>

        {/* Group Dropdown (if groups exist) */}
        {groups.length > 0 && (
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Group
            </label>
            <DropdownContainer
              isOpen={showGroupDropdown}
              onClose={() => setShowGroupDropdown(false)}
              className="relative"
            >
              <button
                ref={groupTriggerRef}
                type="button"
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 outline-none transition-colors hover:border-white/20 focus:border-white/30"
              >
                <span>{selectedGroup?.name || 'No group'}</span>
                <ChevronDown size={16} className="text-white/40" />
              </button>

              <AdaptiveDropdown triggerRef={groupTriggerRef} isOpen={showGroupDropdown} width="w-full" preferredPosition="left">
                <DropdownItem
                  onClick={() => {
                    setGroupId('');
                    setShowGroupDropdown(false);
                  }}
                >
                  No group
                </DropdownItem>
                <DropdownDivider />
                {groups.map((g) => (
                  <DropdownItem
                    key={g.id}
                    onClick={() => {
                      setGroupId(g.id);
                      setShowGroupDropdown(false);
                    }}
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: g.color || '#888' }}
                    />
                    {g.name}
                  </DropdownItem>
                ))}
              </AdaptiveDropdown>
            </DropdownContainer>
          </div>
        )}

        {/* Pin to Dashboard Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-sm text-white/70">Pin to Dashboard</span>
          <button
            type="button"
            onClick={() => (canPin || link.pinned) && onPin()}
            disabled={!canPin && !link.pinned}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              link.pinned ? 'bg-primary-500' : 'bg-white/20'
            } ${!canPin && !link.pinned ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                link.pinned ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="submit"
            disabled={!url.trim()}
            className="w-full rounded-lg bg-primary-500/80 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Changes
          </button>

          {confirmDelete ? (
            <div className="rounded-lg bg-red-500/10 p-3">
              <p className="mb-2 text-center text-xs text-white/70">
                Delete this link?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded px-2 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 rounded bg-red-500/80 px-2 py-1.5 text-xs text-white transition-colors hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full rounded-lg border border-red-500/30 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              Delete Link
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// Momentum-style Edit Group Form View
interface EditGroupFormViewProps {
  group: LinkGroup;
  linkCount: number;
  canPin: boolean;
  onSave: (name: string) => void;
  onDelete: () => void;
  onBack: () => void;
  onPin: () => void;
}

function EditGroupFormView({
  group,
  linkCount,
  canPin,
  onSave,
  onDelete,
  onBack,
  onPin,
}: EditGroupFormViewProps) {
  const [name, setName] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name);
    }
  };

  return (
    <div>
      {/* Header with back arrow */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-white/60 transition-colors hover:text-white/80"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">Editing group</span>
      </button>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name Field */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30"
          />
        </div>

        {/* Pin to Dashboard Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-sm text-white/70">Pin to Dashboard</span>
          <button
            type="button"
            onClick={() => (canPin || group.pinned) && onPin()}
            disabled={!canPin && !group.pinned}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              group.pinned ? 'bg-primary-500' : 'bg-white/20'
            } ${!canPin && !group.pinned ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                group.pinned ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Link Count Info */}
        {linkCount > 0 && (
          <p className="text-xs text-white/40">
            This group contains {linkCount} link{linkCount > 1 ? 's' : ''}.
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-lg bg-primary-500/80 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Changes
          </button>

          {confirmDelete ? (
            <div className="rounded-lg bg-red-500/10 p-3">
              <p className="mb-2 text-center text-xs text-white/70">
                Delete '{group.name}'?
                {linkCount > 0 && (
                  <span className="text-red-400">
                    {' '}
                    {linkCount} link{linkCount > 1 ? 's' : ''} will become
                    ungrouped.
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded px-2 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 rounded bg-red-500/80 px-2 py-1.5 text-xs text-white transition-colors hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full rounded-lg border border-red-500/30 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              Delete Group
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
