export function createCloudStorage(supabase, userId) {
  if (!supabase || !userId) {
    throw new Error("Cloud storage requires an authenticated user.");
  }

  return {
    async get(key) {
      if (key === "char-index") {
        const { data, error } = await supabase
          .from("characters")
          .select("id,name,race,class_name,level")
          .eq("user_id", userId)
          .neq("id", "ledger-workspace")
          .order("created_at", { ascending: true });

        if (error) throw error;

        const value = (data || []).map((row) => ({
          id: row.id,
          name: row.name || "New adventurer",
          race: row.race || "",
          className: row.class_name || "",
          level: row.level || 1,
        }));

        return { value: JSON.stringify(value) };
      }

      if (key.startsWith("char-detail:")) {
        const id = key.slice("char-detail:".length);

        const { data, error } = await supabase
          .from("characters")
          .select("data")
          .eq("user_id", userId)
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;

        return data ? { value: JSON.stringify(data.data) } : null;
      }

      return null;
    },

    async set(key, value) {
      if (key === "char-index") return { value };

      if (key.startsWith("char-detail:")) {
        const id = key.slice("char-detail:".length);
        const character = JSON.parse(value);

        const row = {
          id,
          user_id: userId,
          name: character.name || "New adventurer",
          race: character.race || "",
          class_name: character.className || "",
          level: Number(character.level || 1),
          data: character,
        };

        const { error } = await supabase
          .from("characters")
          .upsert(row, { onConflict: "user_id,id" });

        if (error) throw error;

        return { value };
      }

      return { value };
    },

    async delete(key) {
      if (key.startsWith("char-detail:")) {
        const id = key.slice("char-detail:".length);

        const { error } = await supabase
          .from("characters")
          .delete()
          .eq("user_id", userId)
          .eq("id", id);

        if (error) throw error;
      }

      return { value: null };
    },
  };
}
