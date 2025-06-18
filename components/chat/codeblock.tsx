"use client";

import { FC, memo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import {
  LucideCheck,
  LucideCopy,
  LucideDownload,
  LucideCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  language: string;
  value: string;
}

interface languageMap {
  [key: string]: string | undefined;
}

export const programmingLanguages: languageMap = {
  javascript: ".js",
  python: ".py",
  java: ".java",
  c: ".c",
  cpp: ".cpp",
  "c++": ".cpp",
  "c#": ".cs",
  ruby: ".rb",
  php: ".php",
  swift: ".swift",
  "objective-c": ".m",
  kotlin: ".kt",
  typescript: ".ts",
  go: ".go",
  perl: ".pl",
  rust: ".rs",
  scala: ".scala",
  haskell: ".hs",
  lua: ".lua",
  shell: ".sh",
  sql: ".sql",
  html: ".html",
  css: ".css",
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
};

export const generateRandomString = (length: number, lowercase = false) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXY3456789"; // excluding similar looking characters like Z, 2, I, 1, O, 0
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return lowercase ? result.toLowerCase() : result;
};

const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
  const [isHovered, setIsHovered] = useState(false);

  // If language is not provided, render a simple gray box
  if (!language) {
    return (
      <span className="px-4 py-2 my-2 rounded-lg text-default-500 bg-zinc-100 dark:bg-zinc-800  overflow-auto">
        {value}
      </span>
    );
  }

  const downloadAsFile = () => {
    if (typeof window === "undefined") {
      return;
    }
    const fileExtension = programmingLanguages[language] || ".file";
    const suggestedFileName = `file-${generateRandomString(
      3,
      true
    )}${fileExtension}`;
    const fileName = window.prompt("Enter file name", suggestedFileName);

    if (!fileName) {
      // User pressed cancel on prompt.
      return;
    }

    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(value);
  };

  if (language === "math" && value?.length < 25) {
    return (
      <span id="space-text" className="font-medium pl-1">
        {value}
      </span>
    );
  }

  return (
    <div className="relative w-full font-sans codeblock bg-zinc-900/90 backdrop-blur-sm rounded-2xl  border border-zinc-800/50 overflow-hidden shadow-lg">
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between w-full px-5 py-3 rounded-none text-zinc-200 border-b border-zinc-800/50 backdrop-blur-sm bg-zinc-900/50 ",
          "bg-dark-900"
        )}
      >
        <div className="flex items-center gap-2">
          <LucideCode className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-xs font-medium tracking-wider text-zinc-400">
            {language}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="p-1.5 rounded-2xl hover:bg-zinc-800/70 text-zinc-400 hover:text-indigo-300 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 transition-all"
            onClick={downloadAsFile}
            aria-label="Download code as file"
          >
            <LucideDownload className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 rounded-2xl hover:bg-zinc-800/70 text-zinc-400 hover:text-indigo-300 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 transition-all"
            onClick={onCopy}
          >
            {isCopied ? (
              <LucideCheck className="h-3.5 w-3.5 text-blue-400" />
            ) : (
              <LucideCopy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="relative overflow-hidden bg-zinc-950/90 rounded-b-2xl">
        {/* Corner accent */}
        <div
          className="absolute -top-10 -right-10 w-20 h-20 bg-indigo-500/10 blur-xl rounded-full opacity-0 transition-opacity duration-700"
          style={{ opacity: isHovered ? 0.7 : 0 }}
        />

        {/* Syntax highlighter */}
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          PreTag="div"
          customStyle={{
            margin: 0,
            width: "100%",
            background: "transparent",
            padding: "1.5rem",
            fontSize: "1rem",
            fontFamily: "inter",
            overflowX: "auto",
          }}
          id="code-syntax"
          lineNumberStyle={{
            userSelect: "none",
            color: "#52525b60",
            marginRight: "1.5em",
            borderRight: "1px solid #27272a30",
            paddingRight: "0.5em",
          }}
          showLineNumbers={false}
          wrapLines={true}
          wrapLongLines={false}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});
CodeBlock.displayName = "CodeBlock";

export { CodeBlock };
