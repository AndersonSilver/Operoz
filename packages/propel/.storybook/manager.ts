import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

const operozTheme = create({
  base: "dark",
  brandTitle: "Operoz UI",
  brandUrl: "https://plane.so",
  brandImage: "operoz-lockup-light.svg",
  brandTarget: "_self",
});

addons.setConfig({
  theme: operozTheme,
});
