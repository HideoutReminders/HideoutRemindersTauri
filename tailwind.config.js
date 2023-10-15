/** @type {import('tailwindcss').Config} */
import {themes} from "./src/theme";

export default {
	content: [
		"./src/**/*.{js,jsx,ts,tsx}",
	],
  theme: {
    extend: {},

  },
	daisyui: {
		themes: themes,
	},
  plugins: [require("daisyui")],
}

