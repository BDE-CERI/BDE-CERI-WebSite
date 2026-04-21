"use client";

import { useRouter } from "next/navigation";

export default function MemberSwitcher({ 
  allMembers, 
  currentId,
  myId 
}: { 
  allMembers: any[], 
  currentId: string,
  myId: string 
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 bg-surface-container-high p-2 rounded-xl border border-outline-variant/30">
      <span className="material-symbols-outlined text-primary text-sm">group</span>
      <select 
        className="bg-transparent outline-none cursor-pointer pr-4 text-sm font-bold"
        value={currentId}
        onChange={(e) => {
          const val = e.target.value;
          if (val === myId) {
            router.push('/profil');
          } else {
            router.push('/profil?edit_member_id=' + val);
          }
        }}
      >
        <option value={myId}>-- Mon Profil --</option>
        {allMembers.filter(m => m.id !== myId).map(m => (
           <option key={m.id} value={m.id}>
             {m.first_name} {m.last_name} ({m.role_label})
           </option>
        ))}
      </select>
    </div>
  );
}
