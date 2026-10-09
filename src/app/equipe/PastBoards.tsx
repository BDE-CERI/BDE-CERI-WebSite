"use client";

import { useState } from "react";
import Image from "next/image";
import { getPastBoards, getPastBoardMembers, type PastBoardMember } from "./actions";
import type { getDictionary } from "@/locales/dictionaries";
import { getPublicMemberName } from "@/utils/member-display";

interface PastBoard {
  id: string;
  academic_year: string;
  theme?: string;
  description?: string;
  cover_url?: string;
}

export default function PastBoards({ dict }: { dict: Awaited<ReturnType<typeof getDictionary>> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [boards, setBoards] = useState<PastBoard[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedBoardId, setExpandedBoardId] = useState<string | null>(null);
  const [boardMembers, setBoardMembers] = useState<Record<string, PastBoardMember[]>>({});

  const handleToggle = async () => {
    if (!isOpen && boards.length === 0) {
      setLoading(true);
      const boardsData = await getPastBoards();
      setBoards(boardsData);
      setLoading(false);
    }
    setIsOpen(!isOpen);
  };

  const handleBoardExpand = async (boardId: string) => {
    if (expandedBoardId === boardId) {
      setExpandedBoardId(null);
      return;
    }

    if (!boardMembers[boardId]) {
      const members = await getPastBoardMembers(boardId);
      setBoardMembers(prev => ({ ...prev, [boardId]: members }));
    }
    setExpandedBoardId(boardId);
  };

  return (
    <section className="mt-20 border-t border-outline-variant/20 pt-12">
      <div className="flex flex-col items-center">
        <button
          onClick={handleToggle}
          className="group flex flex-col items-center gap-3 transition-transform hover:scale-105"
        >
          <span className="font-headline text-lg font-bold text-on-surface-variant group-hover:text-primary transition-colors">
            {isOpen ? dict.ancien_bureau.hide : dict.ancien_bureau.show}
          </span>
          <div className={`w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
            <span className="material-symbols-outlined">expand_more</span>
          </div>
        </button>

        {isOpen && (
          <div className="w-full mt-12 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="flex items-center gap-2 text-on-surface-variant italic">
                  <span className="animate-spin material-symbols-outlined">sync</span>
                  {dict.ancien_bureau.loading}
                </div>
              </div>
            ) : boards.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant italic">
                {dict.ancien_bureau.empty}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
                {boards.map((board) => (
                  <div key={board.id} className="glass-panel ghost-border rounded-xl overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => handleBoardExpand(board.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-surface-container-high transition-colors"
                    >
                      <div className="flex items-center gap-6">
                        <div className="text-left">
                          <h3 className="font-headline text-xl font-bold text-primary">{board.academic_year}</h3>
                          {board.theme && <p className="text-xs text-tertiary uppercase tracking-widest">{board.theme}</p>}
                        </div>
                      </div>
                      <span className={`material-symbols-outlined transition-transform duration-300 ${expandedBoardId === board.id ? 'rotate-180' : ''}`}>
                        keyboard_arrow_down
                      </span>
                    </button>

                    {expandedBoardId === board.id && (
                      <div className="p-6 pt-0 animate-in fade-in zoom-in-95 duration-300">
                        <div className="h-px bg-outline-variant/10 mb-6"></div>
                        {board.description && <p className="text-sm text-on-surface-variant mb-8 italic">{board.description}</p>}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {boardMembers[board.id]?.map((m) => (
                            <div key={m.id} className="flex items-center gap-4 group/member">
                              <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/20 flex-shrink-0 transition-all duration-500 group-hover/member:border-primary/40">
                                {m.photo_url ? (
                                  <Image src={m.photo_url} alt={getPublicMemberName(m)} width={48} height={48} className="w-full h-full object-cover transition-all duration-500 filter grayscale group-hover/member:grayscale-0 group-hover/member:scale-105" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xs opacity-50">person</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-left">
                                <p className="font-headline font-bold text-sm text-on-surface group-hover/member:text-primary transition-colors">
                                  {getPublicMemberName(m)}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                                  {m.role_label}
                                </p>
                                {m.study_year && <p className="text-[9px] text-tertiary opacity-70">{m.study_year}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
