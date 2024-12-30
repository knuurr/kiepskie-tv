/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        kiepscy: ['Boink LET Plain', ...fontFamily.sans],
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        halloween: {
          ...require("daisyui/src/theming/themes")["halloween"],
          "primary": "ffdd00", // mocny full
        },
      },
      "dark"
    ],
    darkTheme: "halloween"
  },
}

