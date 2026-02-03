import { useState, useRef } from 'react';
import {
  MoreVertical,
  Pencil,
  Trash2,
  PinOff,
  ExternalLink,
  Folder,
  ChevronDown,
} from 'lucide-react';
import {
  AdaptiveDropdown,
  DropdownItem,
  DropdownDivider,
  DropdownContainer,
} from '@/components/ui/Dropdown';
import { useQuickLinksStore } from '@/stores/quickLinksStore';
import type { QuickLink, LinkGroup } from '@/types';

interface PinnedLinkItemProps {
  link: QuickLink;
  onEdit: () => void;
}

export function PinnedLinkItem({ link, onEdit }: PinnedLinkItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { unpinLink, deleteLink } = useQuickLinksStore();
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <DropdownContainer
      isOpen={showMenu}
      onClose={() => setShowMenu(false)}
      className="relative"
    >
      <div className="group/pinned relative flex items-center">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          title={`${link.name} - ${link.url}`}
        >
          {link.icon ? (
            <img
              src={link.icon}
              alt={link.name}
              className="h-5 w-5 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : (
            <ExternalLink size={20} />
          )}
        </a>

        {/* Three-dot menu trigger */}
        <button
          ref={triggerRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute -right-1 -top-1 rounded-full bg-gray-800/80 p-0.5 text-white/60 opacity-0 transition-all hover:bg-gray-700 hover:text-white group-hover/pinned:opacity-100"
          aria-label="More options"
        >
          <MoreVertical size={10} />
        </button>
      </div>

      {/* Dropdown menu */}
      <AdaptiveDropdown triggerRef={triggerRef} isOpen={showMenu} width="w-28" preferredPosition="left">
        <DropdownItem onClick={() => {
          onEdit();
          setShowMenu(false);
        }}>
          <Pencil size={12} />
          Edit
        </DropdownItem>
        <DropdownItem onClick={() => {
          unpinLink(link.id);
          setShowMenu(false);
        }}>
          <PinOff size={12} />
          Unpin
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem
          onClick={() => {
            deleteLink(link.id);
            setShowMenu(false);
          }}
          className="text-red-400"
        >
          <Trash2 size={12} />
          Delete
        </DropdownItem>
      </AdaptiveDropdown>
    </DropdownContainer>
  );
}

interface PinnedGroupItemProps {
  group: LinkGroup;
  links: QuickLink[];
  onEdit: () => void;
}

export function PinnedGroupItem({ group, links, onEdit }: PinnedGroupItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const { unpinGroup, deleteGroup } = useQuickLinksStore();
  const folderButtonRef = useRef<HTMLButtonElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <DropdownContainer
      isOpen={showMenu || showLinks}
      onClose={() => {
        setShowMenu(false);
        setShowLinks(false);
      }}
      className="relative"
    >
      <div className="group/pinned relative flex items-center">
        <button
          ref={folderButtonRef}
          onClick={() => setShowLinks(!showLinks)}
          className="flex items-center justify-center rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          title={`${group.name} (${links.length} links)`}
          style={{ color: group.color || undefined }}
        >
          <Folder size={20} />
          {links.length > 0 && (
            <ChevronDown
              size={10}
              className={`ml-0.5 transition-transform ${showLinks ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        {/* Three-dot menu trigger */}
        <button
          ref={menuTriggerRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
            setShowLinks(false);
          }}
          className="absolute -right-1 -top-1 rounded-full bg-gray-800/80 p-0.5 text-white/60 opacity-0 transition-all hover:bg-gray-700 hover:text-white group-hover/pinned:opacity-100"
          aria-label="More options"
        >
          <MoreVertical size={10} />
        </button>
      </div>

      {/* Group links dropdown */}
      <AdaptiveDropdown triggerRef={folderButtonRef} isOpen={showLinks && links.length > 0} width="w-44" preferredPosition="left">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          {group.name}
        </div>
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {link.icon ? (
              <img
                src={link.icon}
                alt=""
                className="h-4 w-4 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <ExternalLink size={14} className="text-white/40" />
            )}
            <span className="truncate">{link.name}</span>
          </a>
        ))}
      </AdaptiveDropdown>

      {/* Options dropdown */}
      <AdaptiveDropdown triggerRef={menuTriggerRef} isOpen={showMenu} width="w-28" preferredPosition="left">
        <DropdownItem onClick={() => {
          onEdit();
          setShowMenu(false);
        }}>
          <Pencil size={12} />
          Edit
        </DropdownItem>
        <DropdownItem onClick={() => {
          unpinGroup(group.id);
          setShowMenu(false);
        }}>
          <PinOff size={12} />
          Unpin
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem
          onClick={() => {
            deleteGroup(group.id);
            setShowMenu(false);
          }}
          className="text-red-400"
        >
          <Trash2 size={12} />
          Delete
        </DropdownItem>
      </AdaptiveDropdown>
    </DropdownContainer>
  );
}
