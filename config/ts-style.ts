import localFont from "next/font/local";

export const fontHeading = localFont({
  src: "../assets/CalSans-SemiBold.woff2",
  variable: "--font-heading",
});

export const steelCSS =
  "text-transparent bg-clip-text bg-gradient-to-tr  from-gray-500 to-slate-900 dark:bg-gradient-to-br dark:from-gray-100 dark:to-slate-700";

export const grayGradientBG =
  " bg-gradient-to-b from-[#ffffff] to-[#ffffff] dark:from-[#222222] dark:to-[#151515]";
