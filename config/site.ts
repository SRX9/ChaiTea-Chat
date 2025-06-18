export type SiteConfig = typeof siteConfig;
export const AppHost = process.env.NEXT_PUBLIC_HOST || "https://chaitea.chat";
export const AppHostDomain =
  process.env.NEXT_PUBLIC_HOST_DOMAIN || "chaitea.chat";

export const siteConfig = {
  name: "ChaiTea Chat",
  twitterHandle: "@chaiteachat",
  logo: "/logo-chaiteachat-min.png",
  description:
    "ChaiTea Chat is an all-in-one AI chat application that works with text, images, and multimodal content. Enjoy AI-powered search, retrieval-augmented generation (RAG), on-the-fly image generation, and advanced intelligent assistance—all within a single unified workspace.",
  ogImage: `${AppHost}/chaitea-banner.webp`,
  url: AppHost,
  contact: {
    name: "Contact",
    description: `For any queries, feedback, or support, contact us.`,
    keywords: [
      "Contact ChaiTea Chat",
      "ChaiTea Chat AI Contact",
      "Contact ChaiTea Chat support",
      "Get in touch with ChaiTea Chat",
      "ChaiTea Chat workspace support",
    ],
  },
  pricing: {
    name: "ChaiTea Chat Premium",
    description:
      "ChaiTea Chat Premium gives you access to unlimited* AI Workspace features, advanced SOUL AI models, priority support, and upcoming enhancements.",
    keywords: [
      "ChaiTea Chat Premium",
      "ChaiTea Chat AI Premium",
      "ChaiTea Chat workspace pricing",
      "premium plans ChaiTea Chat",
      "ChaiTea Chat subscription",
      "AI workspace premium",
    ],
  },
  terms: {
    name: "Terms of Use",
    description: `Terms user agrees with to use ChaiTea Chat - AI Workspace.`,
    keywords: [
      "ChaiTea Chat terms of use",
      "ChaiTea Chat legal terms",
      "user agreement ChaiTea Chat",
      "AI workspace terms",
    ],
  },
  aboutHome: {
    name: "About",
    description: `What is ChaiTea Chat? ChaiTea Chat is an all-in-one AI workspace that merges conversational AI, multimodal understanding, AI search, retrieval-augmented generation (RAG), and image generation to accelerate how you research, create, brainstorm, and code—all in one place.`,
    keywords: [
      "What is ChaiTea Chat",
      "ChaiTea Chat",
      "ChaiTea Chat AI Workspace",
      "ChaiTea Chat overview",
      "ChaiTea Chat features",
      "ChaiTea Chat AI system",
      "multimodal AI",
      "image generation",
      "AI search",
      "RAG",
      "AI workspace",
    ],
  },
  about: {
    name: "SOUL AI",
    description: `Learn more about SOUL AI, the intelligent system powering ChaiTea Chat. SOUL AI unifies multiple AI models and intelligent programs to help you seek information, acquire knowledge, complete tasks, and interact with technology—all within your workspace.`,
    keywords: [
      "What is SOUL AI",
      "SOUL AI",
      "SOUL AI System",
      "SOUL AI overview",
      "SOUL X3 AI features",
      "ChaiTea Chat AI system",
      "AI workspace intelligence",
    ],
  },
  aboutX3: {
    name: "SOUL X3 AI",
    description: `Learn more about SOUL X3, the groundbreaking AI engine behind ChaiTea Chat. SOUL X3 powers advanced search, intelligent answers, and generative UI interactive widgets for a seamless workspace experience.`,
    keywords: [
      "What is SOUL X3 AI",
      "SOUL X3 AI",
      "SOUL X3 AI System",
      "SOUL X3 AI overview",
      "SOUL X3 AI features",
      "ChaiTea Chat X3 AI system",
      "AI workspace engine",
    ],
  },
  policy: {
    name: "Privacy",
    description:
      "Understand our Privacy Policy and how we manage and protect your data while using ChaiTea Chat - AI Workspace.",
    keywords: [
      "ChaiTea Chat privacy policy",
      "data protection ChaiTea Chat",
      "privacy agreement ChaiTea Chat",
      "AI workspace privacy",
    ],
  },
  login: {
    name: "Login",
    description:
      "Sign in to ChaiTea Chat - AI Workspace and start using SOUL AI.",
    keywords: [
      "ChaiTea Chat login",
      "ChaiTea Chat Sign in",
      "sign in ChaiTea Chat",
      "AI workspace login",
    ],
  },
};
