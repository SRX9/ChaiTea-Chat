export const cleanSourceText = (text: string) => {
  if (!text) return "";

  // Remove HTML tags
  const withoutTags = text.replace(/<[^>]*>/g, "");

  // Remove extra whitespace and line breaks
  const cleanedText = withoutTags
    .trim()
    .replace(/(\\n){4,}/g, "\\n\\n\\n")
    .replace(/\\n\\n/g, " ")
    .replace(/ {3,}/g, " ")
    .replace(/\\t/g, "")
    .replace(/\\n+(\\s\*\\n)\*/g, "\\n")
    .replace(/[^\x20-\x7E]/g, "");

  // Remove common advertising and nonsense phrases
  const finalText = cleanedText
    .replaceAll(
      "It looks like your browser does not have JavaScript enabled.",
      ""
    )
    .replaceAll("Please turn on JavaScript and try again", "")
    .replaceAll("Advertisement", "")
    .replaceAll("Advertising", "")
    .replaceAll("Sponsored Content", "")
    .replaceAll("Sign up for our newsletter", "")
    .replaceAll("Subscribe now", "")
    .replaceAll("Click here", "")
    .replaceAll("Read more", "")
    .replaceAll("Continue reading", "");

  return finalText;
};

export const cleanURLForUserView = (
  text: string | null | undefined
): string => {
  if (!text) return "";
  return text
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export function isNumericString(str: string) {
  if (typeof str !== "string") {
    return false;
  }

  return /^\d+$/.test(str);
}
const removeUndefinedFromStart = (str: string) => {
  return str.replace(/^(undefined)*/, "");
};

const removeUndefinedFromEnd = (str: string) => {
  return str.replace(/(undefined)*$/, "");
};

export const cleanUndefinedString = (str: string) => {
  return removeUndefinedFromEnd(removeUndefinedFromStart(str));
};
