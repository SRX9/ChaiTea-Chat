"use client";

import { memo, NamedExoticComponent } from "react";
import ReactMarkdown from "react-markdown";
import type { Options as ReactMarkdownOptions } from "react-markdown";

type ReactMarkdownProps = React.ComponentProps<typeof ReactMarkdown>;

export const MemoizedReactMarkdown: NamedExoticComponent<ReactMarkdownProps> =
  memo(
    ReactMarkdown,
    (prevProps, nextProps) =>
      prevProps.children === nextProps.children &&
      prevProps.className === nextProps.className
  );
