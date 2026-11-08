import React from "react";
import { Text, TextInput } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import RootNavigator from "./src/navigation/RootNavigator";

// Cap system font scaling so large font settings don't break layouts.
const capFontScale = (Component: any, max = 1.15) => {
  const original = Component?.render;
  if (typeof original !== "function") return; // not patchable on this RN version
  Component.render = function (...args: any[]) {
    const element = original.apply(this, args);
    return React.cloneElement(element, {
      maxFontSizeMultiplier: element.props.maxFontSizeMultiplier ?? max,
    });
  };
};

capFontScale(Text);
capFontScale(TextInput);

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <RootNavigator />
      </FavoritesProvider>
    </AuthProvider>
  );
}
