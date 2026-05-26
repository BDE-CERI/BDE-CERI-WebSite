"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function buyItem(id: string, isTaverne: boolean) {
  const supabase = await createClient();
  const table = isTaverne ? "taverne_items" : "products";

  // Get current stock
  const { data, error } = await supabase
    .from(table)
    .select("stock")
    .eq("id", id)
    .single();

  if (error || !data) {
    return { error: "Item introuvable." };
  }

  // Treat undefined or null stock as infinite, unless it's explicitly 0
  if (data.stock === undefined || data.stock === null) {
      return { error: "L'article n'a pas de gestion de stock configurée." };
  }

  if (data.stock > 0) {
    const { error: updateError } = await supabase
      .from(table)
      .update({ stock: data.stock - 1 })
      .eq("id", id);

    if (updateError) {
      return { error: "Erreur lors de la mise à jour du stock." };
    }

    revalidatePath("/boutique");
    if (!isTaverne) {
      revalidatePath(`/boutique/${id}`);
    }
    
    return { success: true };
  }

  return { error: "Rupture de stock." };
}
