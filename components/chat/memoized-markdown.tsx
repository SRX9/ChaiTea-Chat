"use client";

import { marked } from "marked";
import { memo, useMemo, NamedExoticComponent, useId } from "react";
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "./codeblock";
import { Mermaid } from "./Mermaid";

// Split a markdown string into an array of raw blocks so each block can be cached separately
function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

// Renders a single markdown block. This component is memoized so it only re-renders
// when its own content changes.
const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        // Custom renderers so we can show our own <CodeBlock> and <Mermaid> components
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className ?? "");
            const language = match?.[1] ?? "";
            const value = String(children).replace(/\n$/, "");

            if (!inline && language === "mermaid") {
              return <Mermaid chart={value} />;
            }

            if (!inline && language) {
              return <CodeBlock language={language} value={value} />;
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
);
MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

interface MemoizedMarkdownProps {
  content: string;
  id?: string;
}

// The main component exposed to the rest of the app. It memoizes the result of
// parsing the markdown into blocks and returns a list of <MemoizedMarkdownBlock>
// elements, each keyed by a stable id so React can efficiently reconcile them.
export const MemoizedMarkdown: NamedExoticComponent<MemoizedMarkdownProps> =
  memo(({ content, id }: MemoizedMarkdownProps) => {
    const generatedId = useId();
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);
    const uniqueId = id ?? generatedId;

    return (
      <>
        {blocks.map((block, index) => (
          <MemoizedMarkdownBlock
            key={`${uniqueId}-block_${index}`}
            content={block}
          />
        ))}
      </>
    );
  });
MemoizedMarkdown.displayName = "MemoizedMarkdown";
