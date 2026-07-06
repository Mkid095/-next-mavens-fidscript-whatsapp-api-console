import { Compass, Send, Users, MessageSquare, UserCircle, Settings, Smartphone, Inbox } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Platform:  <Compass size={13} />,
  Messaging:  <Send size={13} />,
  Groups:    <Users size={13} />,
  Chats:     <MessageSquare size={13} />,
  Profile:   <UserCircle size={13} />,
  Settings:  <Settings size={13} />,
  Instance:  <Smartphone size={13} />,
  Receiving: <Inbox size={13} />,
};

interface CategorySidebarProps {
  categories: { name: string }[];
  activeCategory: string;
  onSelect: (cat: string) => void;
}

export function CategorySidebar({ categories, activeCategory, onSelect }: CategorySidebarProps) {
  return (
    <div className="w-full lg:w-44 shrink-0 space-y-1">
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => onSelect(cat.name)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeCategory === cat.name
              ? 'bg-yellow-500 text-[#181711]'
              : 'text-[#6e684a] hover:bg-[#2d2813]'
          }`}
        >
          {CATEGORY_ICONS[cat.name]}
          {cat.name}
        </button>
      ))}
    </div>
  );
}
