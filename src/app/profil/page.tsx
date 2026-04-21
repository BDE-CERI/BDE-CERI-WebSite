import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { signOut, updateProfile, addEvent, addProduct, addNews, addAssignment, deleteAssignment } from "./actions";
import EditModeToggle from "./EditModeToggle";
import MemberSwitcher from "./MemberSwitcher";
import EventManager from "./EventManager";
import ShopManager from "./ShopManager";
import NewsManager from "./NewsManager";
import PoleManager from "./PoleManager";
import ImageUpload from "@/components/ImageUpload";

export default async function ProfilPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const editMemberId = searchParams.edit_member_id;
  
  const dict = await getDictionary();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 1. Try to find member by linked Auth ID
  let { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  // 2. Fallback: If not found, try to find by Email and link it automatically
  if (!member) {
    const { data: emailMatch } = await supabase
      .from("members")
      .select("*")
      .eq("email", user.email)
      .is("auth_user_id", null)
      .single();

    if (emailMatch) {
      // Auto-link the account
      const { data: updated } = await supabase
        .from("members")
        .update({ auth_user_id: user.id })
        .eq("id", emailMatch.id)
        .select()
        .single();
      member = updated;
    }
  }

  if (!member) {
    return (
      <div className="pt-32 pb-20 px-6 text-center">
        <h1 className="text-2xl font-bold">Profil non trouvé</h1>
        <p className="mb-4">Votre email (<strong>{user.email}</strong>) n'est pas encore enregistré dans la liste des membres du BDE.</p>
        <p className="mb-8 text-on-surface-variant text-sm">Contactez un administrateur pour être ajouté à la table <code>members</code>.</p>
        <form action={signOut}>
          <button className="bg-primary text-on-primary px-6 py-2 rounded-lg">Se déconnecter</button>
        </form>
      </div>
    );
  }

  const isBR = member.category === "bureau_restreint" || 
               ["president", "tresorier", "secretaire", "vp_general"].includes(member.role || "");

  // Fetch all assignments for the member to check for COM pole
  const { data: userAssignments } = await supabase.from("member_assignments").select("*, poles(name)").eq("member_id", member.id);
  const isCOM = userAssignments?.some(a => a.poles?.name?.toLowerCase().includes("com"));
  const canManageNews = isBR || isCOM;

  // Handle Admin Member Switching
  let targetMember = member;
  if (isBR && editMemberId) {
    const { data: tm } = await supabase.from("members").select("*").eq("id", editMemberId).single();
    if (tm) targetMember = tm;
  }

  // Fetch management data if BR
  let events = [];
  let taverneItems = [];
  let brandingItems = [];
  let news = [];
  let poles = [];

  if (canManageNews) {
    const { data: n } = await supabase.from("news").select("*").order("published_at", { ascending: false });
    news = n || [];
  }

  if (isBR) {
    const { data: e } = await supabase.from("events").select("*").order("date_start", { ascending: false });
    const { data: ti } = await supabase.from("taverne_items").select("*").order("order_index", { ascending: true });
    const { data: bi } = await supabase.from("products").select("*").order("order_index", { ascending: true });
    const { data: n } = await supabase.from("news").select("*").order("published_at", { ascending: false });
    const { data: p } = await supabase.from("poles").select("*").order("order_index", { ascending: true });

    events = e || [];
    taverneItems = ti || [];
    brandingItems = bi || [];
    news = n || [];
    poles = p || [];
  }

  // Fetch all members for the switcher if BR
  let allMembers: any[] = [];
  if (isBR) {
    const { data: am } = await supabase.from("members").select("id, first_name, last_name, role_label").order("last_name");
    allMembers = am || [];
  }

  return (
    <div className="pt-12 pb-24 px-4 md:px-8 max-w-6xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary/20 relative group">
            {targetMember.photo_url ? (
              <img src={targetMember.photo_url} alt={targetMember.first_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white">photo_camera</span>
            </div>
          </div>
          <div>
            <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-gradient">
              {targetMember.first_name} {targetMember.last_name}
            </h1>
            <p className="font-headline text-lg text-tertiary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              {targetMember.role_label}
              {editMemberId && editMemberId !== member.id && (
                <span className="ml-2 px-2 py-0.5 bg-warning-container text-warning text-[10px] rounded uppercase font-bold">Modification Admin</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-4 text-sm font-bold">
          {isBR && (
            <MemberSwitcher 
              allMembers={allMembers} 
              currentId={editMemberId || member.id} 
              myId={member.id} 
            />
          )}
          <form action={signOut}>
            <button className="flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-bold bg-error-container/10 text-error hover:bg-error-container/20 transition-colors">
              <span className="material-symbols-outlined text-sm">logout</span>
              {dict.profil.sign_out}
            </button>
          </form>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Column */}
        <div className="lg:col-span-1 space-y-8">
          <section className="glass-panel p-6 rounded-2xl ghost-border overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-6xl">settings</span>
            </div>
            <h2 className="font-headline text-xl font-bold mb-6 flex items-center gap-2">
              {dict.profil.settings}
            </h2>

            <details className="group bg-surface-container-high rounded-xl border border-outline-variant/20 overflow-hidden mb-4 shadow-sm" open>
              <summary className="font-headline text-sm font-bold p-4 cursor-pointer flex items-center justify-between select-none hover:bg-surface-container-highest transition-colors outline-none">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    {editMemberId && editMemberId !== member.id ? "admin_panel_settings" : "person_edit"}
                  </span>
                  {editMemberId && editMemberId !== member.id 
                    ? `Modifier le profil de ${targetMember.first_name}` 
                    : dict.profil.settings || "Éditer mes informations"}
                </div>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
              </summary>
              <div key={targetMember.id} className="p-4 border-t border-outline-variant/20 bg-surface-container-low">
                <form action={async (formData) => { "use server"; await updateProfile(formData); }} className="space-y-4">
                  {editMemberId && <input type="hidden" name="target_member_id" value={editMemberId} />}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Photo de profil</label>
                    <ImageUpload name="photo" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">{dict.profil.email}</label>
                    <input 
                      type="email" 
                      value={targetMember.email || ""} 
                      disabled 
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface-variant cursor-not-allowed text-sm" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Prénom</label>
                      <input 
                        name="first_name"
                        type="text" 
                        defaultValue={targetMember.first_name}
                        className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface text-sm focus:border-primary transition-colors outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Nom</label>
                      <input 
                        name="last_name"
                        type="text" 
                        defaultValue={targetMember.last_name}
                        className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface text-sm focus:border-primary transition-colors outline-none" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Discord</label>
                      <input 
                        name="discord"
                        type="text" 
                        placeholder="Ex: Gautier#1234"
                        defaultValue={targetMember.discord || ""}
                        className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface text-sm focus:border-primary transition-colors outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Instagram</label>
                      <input 
                        name="instagram"
                        type="text" 
                        placeholder="Ex: @gautier"
                        defaultValue={targetMember.instagram || ""}
                        className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface text-sm focus:border-primary transition-colors outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Niveau d'étude</label>
                      <select name="study_level" defaultValue={targetMember.study_level || ""} required className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface text-sm focus:border-primary transition-colors outline-none cursor-pointer">
                        <option value="" disabled>Sélectionner un niveau</option>
                        <option value="L1">L1</option>
                        <option value="BUT 1">BUT 1</option>
                        <option value="L1/2">L1/2</option>
                        <option value="L2">L2</option>
                        <option value="BUT 2">BUT 2</option>
                        <option value="L2/3">L2/3</option>
                        <option value="L3">L3</option>
                        <option value="BUT 3">BUT 3</option>
                        <option value="M1">M1</option>
                        <option value="M2">M2</option>
                        <option value="D1">D1</option>
                        <option value="D2">D2</option>
                        <option value="D3">D3</option>
                      </select>
                    </div>
                    {isBR && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Ordre de priorité (Rank)</label>
                        <input 
                          name="rank"
                          type="number"
                          defaultValue={targetMember.rank || 100}
                          className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface text-sm focus:border-primary transition-colors outline-none font-mono" 
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">{dict.profil.bio}</label>
                    <textarea 
                      name="bio"
                      placeholder={dict.profil.bio_placeholder}
                      defaultValue={targetMember.bio || ""}
                      rows={3}
                      className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface text-sm focus:border-primary transition-colors outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Responsabilités (Rôle Associatif)</label>
                    <textarea 
                      name="responsibilities"
                      placeholder="Décrivez vos missions et responsabilités..."
                      defaultValue={targetMember.responsibilities || ""}
                      rows={2}
                      className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface text-sm focus:border-primary transition-colors outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Parcours Académique</label>
                    <textarea 
                      name="academic_journey"
                      placeholder="Décrivez votre parcours d'étudiant..."
                      defaultValue={targetMember.academic_journey || ""}
                      rows={2}
                      className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface text-sm focus:border-primary transition-colors outline-none resize-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    {dict.profil.save}
                  </button>
                </form>
              </div>
            </details>
          </section>

          {isBR && (
            <section className="glass-panel p-6 rounded-2xl ghost-border border-primary/30 bg-primary-container/10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined">edit_square</span>
                  {dict.profil.edit_mode}
                </h2>
                <EditModeToggle dict={dict} />
              </div>
              <p className="text-xs text-on-surface-variant">{dict.profil.edit_mode_desc}</p>
            </section>
          )}
        </div>

        {/* Dashboard Column */}
        <div className="lg:col-span-2 space-y-8">
          {isBR ? (
            <>
              <section className="glass-panel p-6 md:p-8 rounded-2xl ghost-border space-y-6">
                <h2 className="font-headline text-2xl font-bold mb-8 flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary">dashboard</span>
                  Administration du Bureau
                </h2>

                <div className="space-y-4">
                  {/* Events Accordion */}
                  <details className="group bg-surface-container border border-outline-variant/15 rounded-xl overflow-hidden shadow-sm">
                    <summary className="font-headline text-lg md:text-xl font-bold p-5 cursor-pointer flex items-center justify-between select-none hover:bg-surface-container-high transition-colors outline-none">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary text-2xl md:text-3xl">event</span>
                        Gestion des Événements
                      </div>
                      <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                    </summary>
                    <div className="p-5 border-t border-outline-variant/15 bg-surface-container-lowest space-y-12">
                      <div className="max-w-xl mx-auto space-y-4 bg-surface-container p-6 rounded-2xl border border-outline-variant/10">
                        <h3 className="font-headline font-bold text-lg flex items-center gap-2 border-b border-outline-variant/20 pb-2">
                          <span className="material-symbols-outlined text-secondary">calendar_add_on</span>
                          {dict.profil.add_event}
                        </h3>
                        <form action={async (formData) => { "use server"; await addEvent(formData); }} className="space-y-3">
                          <input name="title" placeholder="Titre de l'événement" required className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-secondary transition-colors" />
                          <textarea name="description" placeholder="Description" rows={2} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-secondary transition-colors resize-none" />
                          <div className="grid grid-cols-2 gap-3">
                            <input name="date_start" type="datetime-local" required className="bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-secondary transition-colors" />
                            <input name="location" placeholder="Lieu" className="bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-secondary transition-colors" />
                          </div>
                          <ImageUpload name="image" />
                          <button type="submit" className="w-full bg-secondary text-on-secondary font-bold py-2 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-md">
                            Publier l'événement
                          </button>
                        </form>
                      </div>
                      <EventManager dict={dict} initialEvents={events} />
                    </div>
                  </details>

                  {/* Shop Accordion */}
                  <details className="group bg-surface-container border border-outline-variant/15 rounded-xl overflow-hidden shadow-sm">
                    <summary className="font-headline text-lg md:text-xl font-bold p-5 cursor-pointer flex items-center justify-between select-none hover:bg-surface-container-high transition-colors outline-none">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-tertiary text-2xl md:text-3xl">shopping_bag</span>
                        Gestion de la Boutique
                      </div>
                      <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                    </summary>
                    <div className="p-5 border-t border-outline-variant/15 bg-surface-container-lowest space-y-12">
                      <div className="max-w-xl mx-auto space-y-4 bg-surface-container p-6 rounded-2xl border border-outline-variant/10">
                        <h3 className="font-headline font-bold text-lg flex items-center gap-2 border-b border-outline-variant/20 pb-2">
                          <span className="material-symbols-outlined text-tertiary">add_shopping_cart</span>
                          {dict.profil.add_product}
                        </h3>
                        <form action={async (formData) => { "use server"; await addProduct(formData); }} className="space-y-3">
                          <input name="name" placeholder="Nom de l'article" required className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-tertiary transition-colors" />
                          <div className="grid grid-cols-2 gap-3">
                            <input name="price" placeholder="Prix (ex: 2,50)" required className="bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-tertiary transition-colors" />
                            <input name="stock" type="number" placeholder="Stock initial" defaultValue="0" className="bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-tertiary transition-colors" />
                          </div>
                          <div className="space-y-2">
                             <select name="category" required className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-tertiary transition-colors cursor-pointer">
                               <optgroup label="Taverne">
                                 <option value="boisson">Boisson</option>
                                 <option value="snack">Snack</option>
                               </optgroup>
                               <optgroup label="Branding">
                                 <option value="vetement">Vêtement</option>
                                 <option value="accessoire">Accessoire</option>
                                 <option value="goodies">Goodies</option>
                               </optgroup>
                             </select>
                             <div className="flex flex-wrap gap-3 px-1.5 pt-1">
                                {["XS", "S", "M", "L", "XL"].map(size => (
                                  <label key={size} className="flex items-center gap-1.5 cursor-pointer group">
                                     <input type="checkbox" name="sizes" value={size} className="w-3.5 h-3.5 rounded border-outline-variant/30 text-tertiary focus:ring-tertiary" />
                                     <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">{size}</span>
                                  </label>
                                ))}
                             </div>
                          </div>
                          <ImageUpload name="image" />
                          <button type="submit" className="w-full bg-tertiary text-on-tertiary font-bold py-2 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-md">
                            Ajouter à la boutique
                          </button>
                        </form>
                      </div>
                      <ShopManager dict={dict} taverneItems={taverneItems} brandingItems={brandingItems} />
                    </div>
                  </details>

                  {/* News Accordion */}
                  {canManageNews && (
                    <details className="group bg-surface-container border border-outline-variant/15 rounded-xl overflow-hidden shadow-sm" open={searchParams.edit_id ? true : false}>
                      <summary className="font-headline text-lg md:text-xl font-bold p-5 cursor-pointer flex items-center justify-between select-none hover:bg-surface-container-high transition-colors outline-none">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">newspaper</span>
                          Gestion de l&apos;Accueil (Actualités)
                        </div>
                        <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                      </summary>
                      <div className="p-5 border-t border-outline-variant/15 bg-surface-container-lowest space-y-12">
                        <div className="max-w-3xl mx-auto space-y-4 bg-surface-container p-6 rounded-2xl border border-outline-variant/10">
                          <h3 className="font-headline font-bold text-lg flex items-center gap-2 border-b border-outline-variant/20 pb-2">
                            <span className="material-symbols-outlined text-primary">news</span>
                            Publier une Actualité
                          </h3>
                          <form action={async (formData) => { "use server"; await addNews(formData); }} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-3">
                              <input name="title" placeholder="Titre de la news" required className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary transition-colors" />
                              <textarea name="content" placeholder="Contenu de l'actualité..." rows={4} required className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary transition-colors resize-none" />
                              <input type="hidden" name="author_id" value={member.id} />
                            </div>
                              <ImageUpload name="image" />
                              <div className="flex items-center gap-2 px-1">
                                <input type="checkbox" name="is_anonymous" value="true" id="is_anon_create" className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary" />
                                <label htmlFor="is_anon_create" className="text-xs font-bold text-on-surface-variant cursor-pointer select-none">
                                  {dict.news.post_anonymously}
                                </label>
                              </div>
                              <button type="submit" className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-md">
                                Diffuser la news
                              </button>
                          </form>
                        </div>
                        <NewsManager news={news} dict={dict} />
                      </div>
                    </details>
                  )}

                  {/* Assignments Accordion (Multi-statut) */}
                  <details className="group bg-surface-container border border-outline-variant/15 rounded-xl overflow-hidden shadow-sm">
                    <summary className="font-headline text-lg md:text-xl font-bold p-5 cursor-pointer flex items-center justify-between select-none hover:bg-surface-container-high transition-colors outline-none">
                       <div className="flex items-center gap-3">
                         <span className="material-symbols-outlined text-warning text-2xl md:text-3xl">badge</span>
                         Multi-statut (Rôles & Pôles)
                       </div>
                       <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                    </summary>
                    <div className="p-5 border-t border-outline-variant/15 bg-surface-container-lowest space-y-8">
                       <div className="max-w-xl mx-auto p-6 bg-surface-container rounded-2xl border border-outline-variant/10">
                          <h3 className="font-bold mb-4 flex items-center gap-2">
                             <span className="material-symbols-outlined text-warning">add_circle</span>
                             Ajouter un rôle pour {targetMember.first_name}
                          </h3>
                          <form key={targetMember.id} action={async (formData) => { "use server"; await addAssignment(formData); }} className="space-y-3">
                             <input type="hidden" name="member_id" value={targetMember.id} />
                             <select name="pole_id" required className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-warning">
                                <option value="">-- Sélectionner un Pôle --</option>
                                {poles.map(p => (
                                   <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                             </select>
                             <input name="role" placeholder="Intitulé du rôle (ex: Responsable Projets)" required className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-2 text-sm outline-none focus:border-warning" />
                             <div className="flex items-center gap-2 px-2">
                                <input type="checkbox" name="is_vp" id="is_vp_check" value="true" className="w-4 h-4" />
                                <label htmlFor="is_vp_check" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Vice-Président de ce pôle</label>
                             </div>
                             <button type="submit" className="w-full bg-warning text-on-warning font-bold py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
                                Ajouter le statut
                             </button>
                          </form>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {await supabase.from("member_assignments").select("*, poles(name)").eq("member_id", targetMember.id).then(({data, error}) => {
                             if (error) return <p className="text-xs text-error/60 italic p-4 col-span-2">Configuration multi-statut en attente (SQL)...</p>;
                             if (!data || data.length === 0) return <p className="text-xs text-on-surface-variant italic p-4 col-span-2">Aucun rôle additionnel assigné.</p>;
                             
                             return data.map(a => (
                               <div key={a.id} className="flex justify-between items-center p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
                                  <div>
                                     <div className="text-[10px] font-bold text-warning uppercase tracking-widest">Pôle {a.poles?.name}</div>
                                     <div className="text-sm font-bold text-on-surface">{a.role} {a.is_vp && "👑"}</div>
                                  </div>
                                  <form action={async () => { "use server"; await deleteAssignment(a.id); }}>
                                     <button type="submit" className="p-2 text-error-container hover:text-error transition-colors">
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                     </button>
                                  </form>
                               </div>
                             ));
                          })}
                       </div>
                    </div>
                  </details>

                  {/* Poles Accordion */}
                  <details className="group bg-surface-container border border-outline-variant/15 rounded-xl overflow-hidden shadow-sm">
                    <summary className="font-headline text-lg md:text-xl font-bold p-5 cursor-pointer flex items-center justify-between select-none hover:bg-surface-container-high transition-colors outline-none">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-success text-2xl md:text-3xl">account_tree</span>
                        Gestion des Pôles
                      </div>
                      <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                    </summary>
                    <div className="p-5 border-t border-outline-variant/15 bg-surface-container-lowest">
                      <PoleManager poles={poles} dict={dict} />
                    </div>
                  </details>
                </div>
              </section>
            </>
          ) : (
            <section className="glass-panel p-12 rounded-2xl ghost-border text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              </div>
              <h2 className="font-headline text-3xl font-bold mb-4">Bienvenue, {member.first_name} !</h2>
              <p className="text-on-surface-variant max-w-md mx-auto">
                Accès membre : Gérez votre profil et restez informé des actualités du BDE.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
