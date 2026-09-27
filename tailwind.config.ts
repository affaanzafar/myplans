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
        difficulty: {
          hard: "#9C4A38",
          medium: "#8F6B2E",
          easy: "#5B7F65",
          hardtint: "#F6E8E3",
          mediumtint: "#F4EEDD",
          easytint: "#E9F0EA",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(38, 34, 27, 0.05), 0 10px 28px -14px rgba(38, 34, 27, 0.16)",
        lift: "0 2px 4px rgba(38, 34, 27, 0.06), 0 16px 36px -16px rgba(38, 34, 27, 0.22)",
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
