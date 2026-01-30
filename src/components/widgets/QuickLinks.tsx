import { useState } from 'react';
import { Plus, Pencil, ExternalLink } from 'lucide-react';
import { useQuickLinksStore } from '@/stores/quickLinksStore';
import type { QuickLink } from '@/types';

export function QuickLinks() {
  const { links, addLink, updateLink, deleteLink } = useQuickLinksStore();
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="glass-dark w-72 rounded-xl p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/80">Quick Links</h3>

        {!isAddingLink && (
          <button
            onClick={() => setIsAddingLink(true)}
            className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Add link"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Add Link Form */}
      {isAddingLink && (
        <AddLinkForm
          onAdd={(name, url) => {
            addLink(name, url);
            setIsAddingLink(false);
          }}
          onCancel={() => setIsAddingLink(false)}
        />
      )}

      {/* Links Grid */}
      <div className="grid grid-cols-4 gap-2">
        {links.map((link) =>
          editingId === link.id ? (
            <EditLinkForm
              key={link.id}
              link={link}
              onSave={(name, url) => {
                updateLink(link.id, name, url);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
              onDelete={() => {
                deleteLink(link.id);
                setEditingId(null);
              }}
            />
          ) : (
            <LinkItem
              key={link.id}
              link={link}
              onEdit={() => setEditingId(link.id)}
            />
          )
        )}

        {/* Add button in grid when no form is shown */}
        {!isAddingLink && links.length < 12 && (
          <button
            onClick={() => setIsAddingLink(true)}
            className="flex h-14 w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/20 text-white/30 transition-all hover:border-white/40 hover:bg-white/5 hover:text-white/50"
            aria-label="Add new link"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {links.length === 0 && !isAddingLink && (
        <p className="py-4 text-center text-sm text-white/40">
          No links yet. Add your favorites!
        </p>
      )}
    </div>
  );
}

interface LinkItemProps {
  link: QuickLink;
  onEdit: () => void;
}

function LinkItem({ link, onEdit }: LinkItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative"
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

      {/* Edit button */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          className="absolute -right-1 -top-1 rounded-full bg-white/20 p-1 text-white/70 transition-colors hover:bg-white/30 hover:text-white"
          aria-label="Edit link"
        >
          <Pencil size={10} />
        </button>
      )}
    </div>
  );
}

interface AddLinkFormProps {
  onAdd: (name: string, url: string) => void;
  onCancel: () => void;
}

function AddLinkForm({ onAdd, onCancel }: AddLinkFormProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAdd(name, url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-3 space-y-2 rounded-lg bg-white/5 p-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (optional)"
        className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
        autoFocus
      />
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL (e.g., google.com)"
        className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!url.trim()}
          className="flex-1 rounded bg-primary-500/80 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

interface EditLinkFormProps {
  link: QuickLink;
  onSave: (name: string, url: string) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function EditLinkForm({ link, onSave, onCancel, onDelete }: EditLinkFormProps) {
  const [name, setName] = useState(link.name);
  const [url, setUrl] = useState(link.url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSave(name, url);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="col-span-4 space-y-2 rounded-lg bg-white/5 p-3"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
        autoFocus
      />
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL"
        className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!url.trim()}
          className="flex-1 rounded bg-primary-500/80 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded px-3 py-1.5 text-xs text-red-400/80 transition-colors hover:bg-red-500/20 hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </form>
  );
}
