import React from "react";
import {
  Text as RNText,
  TextInput as RNTextInput,
  TextProps,
  TextInputProps,
} from "react-native";

export const Text = (props: TextProps) => (
  <RNText maxFontSizeMultiplier={1} {...props} />
);

// ref is typed loosely on purpose, so it works across React Native versions
export const TextInput = React.forwardRef<any, TextInputProps>((props, ref) => (
  <RNTextInput ref={ref as any} maxFontSizeMultiplier={1} {...props} />
));
TextInput.displayName = "TextInput";
