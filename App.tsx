import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <RootNavigator />
      </FavoritesProvider>
    </AuthProvider>
  );
}
