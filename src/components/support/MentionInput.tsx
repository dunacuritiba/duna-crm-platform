import React, { useState, useRef } from 'react';
import type { User } from '../../types/user';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMention: (userId: string) => void;
  users: User[];
  placeholder?: string;
  rows?: number;
  className?: string;
  required?: boolean;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onMention,
  users,
  placeholder = 'Digite uma descrição... Use @ para marcar colegas',
  rows = 3,
  className = '',
  required = false,
}) => {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const pos = e.target.selectionStart;
    onChange(text);
    setCursorPosition(pos);

    // Look back from cursor to see if we're typing a mention (e.g. "@Lu")
    const textBeforeCursor = text.slice(0, pos);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAt !== -1 && (lastAt === 0 || /\s/.test(textBeforeCursor[lastAt - 1]))) {
      const query = textBeforeCursor.slice(lastAt + 1);
      if (!/\s/.test(query)) {
        setMentionQuery(query.toLowerCase());
        return;
      }
    }

    setMentionQuery(null);
  };

  const handleSelectUser = (user: User) => {
    if (!textareaRef.current) return;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = value.slice(cursorPosition);

    const insertedText = `@${user.name} `;
    const newText = value.slice(0, lastAt) + insertedText + textAfterCursor;

    onChange(newText);
    onMention(user.id);
    setMentionQuery(null);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = lastAt + insertedText.length;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 50);
  };

  const filteredUsers = mentionQuery !== null
    ? users.filter((u) => u.name.toLowerCase().includes(mentionQuery) || u.email.toLowerCase().includes(mentionQuery)).slice(0, 5)
    : [];

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        rows={rows}
        required={required}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition resize-none ${className}`}
      />

      {/* Mention Dropdown */}
      {mentionQuery !== null && filteredUsers.length > 0 && (
        <div className="absolute left-0 right-0 bottom-full mb-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 max-h-48 overflow-y-auto">
          <p className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Marcar membro da equipe
          </p>
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectUser(user);
              }}
              className="w-full px-2.5 py-1.5 flex items-center gap-2.5 hover:bg-indigo-50 rounded-xl transition text-left cursor-pointer"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600">
                {user.role}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
