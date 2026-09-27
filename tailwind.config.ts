import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F1",
        paperdeep: "#F4EEE3",
        card: "#FFFEFB",
        ink: "#26221B",
        muted: "#948B7D",
        hairline: "#E9E2D6",
        hairlinedark: "#D8CEBC",
        hifdh: "#2F6B4F",
        hifdhdeep: "#295C43",
        pcm: "#3A5D85",
        pcmdeep: "#33517A",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
