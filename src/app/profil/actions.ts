"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const bio = formData.get("bio") as string;
  const responsibilities = formData.get("responsibilities") as string;
  const academicJourney = formData.get("academic_journey") as string;
  const discord = formData.get("discord") as string;
  const instagram = formData.get("instagram") as string;
  const targetMemberId = formData.get("target_member_id") as string; // For admins editing others

  const studyLevel = formData.get("study_level") as string;
  const photoFile = formData.get("photo");
  const rank = formData.get("rank") ? parseInt(formData.get("rank") as string) : undefined;

  let photoUrl = undefined;
  // ... (upload logic)
  if (photoFile && typeof photoFile !== "string" && (photoFile as File).size > 0) {
    const file = photoFile as File;
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("member-profiles")
      .upload(fileName, file);
    
    if (uploadError) return { error: "Upload failed: " + uploadError.message };
    const { data: { publicUrl } } = supabase.storage.from("member-profiles").getPublicUrl(uploadData.path);
    photoUrl = publicUrl;
  }

  const updatePayload: any = { 
    first_name: firstName, 
    last_name: lastName, 
    bio: bio,
    study_level: studyLevel,
    responsibilities: responsibilities,
    academic_journey: academicJourney,
    discord: discord,
    instagram: instagram,
    updated_at: new Date().toISOString()
  };

  if (photoUrl) {
    updatePayload.photo_url = photoUrl;
  }

  // Admin specific fields
  if (rank !== undefined) {
    updatePayload.rank = rank;
  }

  let query = supabase.from("members").update(updatePayload);

  if (targetMemberId && targetMemberId !== "" ) {
    // SECURITY CHECK: Only BR can edit others
    const { data: currentUserMember } = await supabase.from("members").select("category, role").eq("auth_user_id", user.id).single();
    const isBR = currentUserMember?.category === "bureau_restreint" || currentUserMember?.role === "president";
    
    if (!isBR) return { error: "Permission refusée" };
    query = query.eq("id", targetMemberId);
  } else {
    query = query.eq("auth_user_id", user.id);
  }

  const { error } = await query;

  if (error) return { error: error.message };

  revalidatePath("/profil");
  revalidatePath("/equipe");
  return { success: true };
}

export async function addEvent(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dateStart = formData.get("date_start") as string;
    const location = formData.get("location") as string;
    const imageFile = formData.get("image");

    let imageUrl = null;

    if (imageFile && typeof imageFile !== "string" && (imageFile as File).size > 0) {
      const file = imageFile as File;
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(fileName, file);
      
      if (uploadError) return { error: "Upload failed: " + uploadError.message };
      const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(uploadData.path);
      imageUrl = publicUrl;
    }

    const { error } = await supabase
      .from("events")
      .insert({
        title,
        description,
        date_start: dateStart,
        location,
        image_url: imageUrl,
        status: "upcoming"
      });

    if (error) return { error: error.message };

    revalidatePath("/evenement");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error in addEvent:", err);
    return { error: err.message || "Une erreur inattendue est survenue" };
  }
}

export async function updateEvent(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const fullContent = formData.get("full_content") as string;
    const dateStart = formData.get("date_start") as string;
    const location = formData.get("location") as string;
    const preciseLocation = formData.get("precise_location") as string;
    const maxCapacityStr = formData.get("max_capacity") as string;
    const maxCapacity = maxCapacityStr ? parseInt(maxCapacityStr) : null;
    const imageFile = formData.get("image");

    let imageUrl = formData.get("current_image_url") as string;

    if (imageFile && typeof imageFile !== "string" && (imageFile as File).size > 0) {
      const file = imageFile as File;
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(fileName, file);
      
      if (uploadError) return { error: "Upload failed: " + uploadError.message };
      const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(uploadData.path);
      imageUrl = publicUrl;
    }

    const { error } = await supabase
      .from("events")
      .update({
        title,
        description,
        full_content: fullContent,
        date_start: dateStart,
        location,
        precise_location: preciseLocation,
        max_capacity: maxCapacity,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/evenement");
    revalidatePath(`/evenement/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateEvent:", err);
    return { error: err.message || "Une erreur est survenue" };
  }
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/evenement");
  revalidatePath("/");
  return { success: true };
}

export async function addProduct(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const category = formData.get("category") as string;
    const imageFile = formData.get("image");
    
    const brandingCategories = ["vetement", "accessoire", "goodies"];
    const isBranding = brandingCategories.includes(category);

    const price = Math.round(parseFloat(priceStr.replace(",", ".")) * 100);

    let imageUrl = null;

    if (imageFile && typeof imageFile !== "string" && (imageFile as File).size > 0) {
      const file = imageFile as File;
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("shop-images")
        .upload(fileName, file);
      
      if (uploadError) return { error: "Upload failed: " + uploadError.message };
      const { data: { publicUrl } } = supabase.storage.from("shop-images").getPublicUrl(uploadData.path);
      imageUrl = publicUrl;
    }

    const stock = parseInt(formData.get("stock") as string || "0");
    const sizes = formData.getAll("sizes") as string[];

    if (isBranding) {
      const { error } = await supabase
        .from("products")
        .insert({
          name,
          description,
          price,
          image_url: imageUrl,
          branding_category: category || "goodies",
          stock: stock,
          sizes: sizes.length > 0 ? sizes : null
        });
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("taverne_items")
        .insert({
          name,
          description,
          price,
          image_url: imageUrl,
          category: category || "boisson",
          stock: stock
        });
      if (error) return { error: error.message };
    }

    revalidatePath("/boutique");
    return { success: true };
  } catch (err: any) {
    console.error("Error in addProduct:", err);
    return { error: err.message || "Une erreur inattendue est survenue" };
  }
}

export async function updateProduct(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const fullContent = formData.get("full_content") as string;
    const priceStr = formData.get("price") as string;
    const category = formData.get("category") as string;
    const imageFile = formData.get("image");

    const brandingCategories = ["vetement", "accessoire", "goodies"];
    const isBranding = brandingCategories.includes(category);
    const price = Math.round(parseFloat(priceStr.replace(",", ".")) * 100);

    let imageUrl = formData.get("current_image_url") as string;

    if (imageFile && typeof imageFile !== "string" && (imageFile as File).size > 0) {
      const file = imageFile as File;
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("shop-images")
        .upload(fileName, file);
      
      if (uploadError) return { error: "Upload failed: " + uploadError.message };
      const { data: { publicUrl } } = supabase.storage.from("shop-images").getPublicUrl(uploadData.path);
      imageUrl = publicUrl;
    }

    const stock = parseInt(formData.get("stock") as string || "0");
    const sizes = formData.getAll("sizes") as string[];

    const updateData: any = {
      name,
      description,
      full_content: fullContent,
      price,
      image_url: imageUrl,
      stock: stock
    };

    if (isBranding) {
      updateData.branding_category = category;
      updateData.sizes = sizes.length > 0 ? sizes : null;
      const { error } = await supabase.from("products").update(updateData).eq("id", id);
      if (error) return { error: error.message };
    } else {
      updateData.category = category;
      const { error } = await supabase.from("taverne_items").update(updateData).eq("id", id);
      if (error) return { error: error.message };
    }

    revalidatePath("/boutique");
    revalidatePath(`/boutique/${id}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateProduct:", err);
    return { error: err.message || "Une erreur est survenue" };
  }
}

export async function deleteProduct(id: string, isBranding: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const table = isBranding ? "products" : "taverne_items";
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/boutique");
  return { success: true };
}

// --- NEWS ACTIONS ---

export async function addNews(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const authorId = formData.get("author_id") as string;
    const imageFile = formData.get("image");

    let imageUrl = null;
    if (imageFile && typeof imageFile !== "string" && (imageFile as File).size > 0) {
      const file = imageFile as File;
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("news-images")
        .upload(fileName, file);
      
      if (uploadError) return { error: "Upload failed: " + uploadError.message };
      const { data: { publicUrl } } = supabase.storage.from("news-images").getPublicUrl(uploadData.path);
      imageUrl = publicUrl;
    }

    const isAnonymous = formData.get("is_anonymous") === "true";
    
    const { error } = await supabase.from("news").insert({
      title,
      content,
      author_id: authorId || null,
      image_url: imageUrl,
      is_published: true,
      is_anonymous: isAnonymous
    });

    if (error) return { error: error.message };

    revalidatePath("/");
    revalidatePath("/profil");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateNews(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const isPublished = formData.get("is_published") === "true";
    const imageFile = formData.get("image");

    let imageUrl = formData.get("current_image_url") as string;
    if (imageFile && typeof imageFile !== "string" && (imageFile as File).size > 0) {
      const file = imageFile as File;
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("news-images")
        .upload(fileName, file);
      
      if (uploadError) return { error: "Upload error: " + uploadError.message };
      const { data: { publicUrl } } = supabase.storage.from("news-images").getPublicUrl(uploadData.path);
      imageUrl = publicUrl;
    }

    const isAnonymous = formData.get("is_anonymous") === "true";
    
    const { error } = await supabase.from("news").update({
      title,
      content,
      is_published: isPublished,
      is_anonymous: isAnonymous,
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    }).eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/");
    revalidatePath("/profil");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteNews(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

// --- POLES ACTIONS ---

export async function updatePole(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const fullContent = formData.get("full_content") as string;
    const color = formData.get("color") as string;
    const imageFile = formData.get("image");

    let imageUrl = formData.get("current_image_url") as string;
    if (imageFile && typeof imageFile !== "string" && (imageFile as File).size > 0) {
      const file = imageFile as File;
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("event-images") // Reusing event-images for poles for simplicity or we can use another
        .upload(fileName, file);
      
      if (uploadError) return { error: "Upload error: " + uploadError.message };
      imageUrl = supabase.storage.from("event-images").getPublicUrl(uploadData.path).data.publicUrl;
    }

    const { error } = await supabase.from("poles").update({
      name,
      description,
      full_content: fullContent,
      color,
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    }).eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/poles");
    revalidatePath(`/poles/${id}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function addAssignment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const memberId = formData.get("member_id") as string;
  const poleId = formData.get("pole_id") as string;
  const role = formData.get("role") as string;
  const isVp = formData.get("is_vp") === "true";

  const { error } = await supabase.from("member_assignments").insert({
    member_id: memberId,
    pole_id: poleId,
    role: role,
    is_vp: isVp
  });

  if (error) return { error: error.message };
  revalidatePath("/profil");
  revalidatePath("/equipe");
  revalidatePath("/poles");
  revalidatePath("/poles/[id]", "page");
  return { success: true };
}

export async function deleteAssignment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("member_assignments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profil");
  revalidatePath("/equipe");
  revalidatePath("/poles");
  revalidatePath("/poles/[id]", "page");
  return { success: true };
}

