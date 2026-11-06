import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { api } from "../api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext({
  ids: [],
  isFavorite: () => false,
  toggle: () => {},
});

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState([]);
  const isCustomer = user?.role === "user";

  // load the user's likes after every login (any device) and clear on logout
  useEffect(() => {
    if (!isCustomer) {
      setIds([]);
      return;
    }
    let cancelled = false;
    api("/favorites/ids")
      .then((d) => {
        if (!cancelled) setIds(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id, isCustomer]);

  const isFavorite = (id) => ids.includes(String(id));

  // update the heart instantly, undo if the server fails
  const toggle = async (id) => {
    id = String(id);
    const was = ids.includes(id);
    setIds((prev) => (was ? prev.filter((x) => x !== id) : [...prev, id]));
    try {
      await api(`/favorites/${id}`, { method: was ? "DELETE" : "POST" });
    } catch (e) {
      setIds((prev) => (was ? [...prev, id] : prev.filter((x) => x !== id)));
      Alert.alert("Could not update favourites", e.message);
    }
  };

  return (
    <FavoritesContext.Provider value={{ ids, isFavorite, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
