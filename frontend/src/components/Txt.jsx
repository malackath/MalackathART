import React from "react";
import { useLang } from "../contexts/LanguageContext";

const FONT_MAP = {
  display: '"Cabinet Grotesk", "Satoshi", system-ui, sans-serif',
  body: '"Satoshi", "Inter", system-ui, sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
};

/**
 * Renders text honoring admin-configured per-key style overrides
 * (font family, weight, italic, size, visibility).
 *
 * <Txt path="home.hero1" as="h1" className="font-display font-black text-8xl">
 *   {t.home.hero1}
 * </Txt>
 */
export const Txt = ({
  path,
  as: Tag = "span",
  className = "",
  style: extraStyle = {},
  children,
  ...rest
}) => {
  const { styles } = useLang();
  const s = styles?.[path] || {};

  if (s.hidden) return null;

  const fontFamily = s.font && FONT_MAP[s.font] ? FONT_MAP[s.font] : undefined;
  const fontWeight = s.weight ? Number(s.weight) : undefined;
  const fontStyle = s.italic ? "italic" : undefined;
  const fontSize =
    s.size && String(s.size).trim() !== "" ? String(s.size).trim() : undefined;

  const inline = {
    ...(fontFamily && { fontFamily }),
    ...(fontWeight && { fontWeight }),
    ...(fontStyle && { fontStyle }),
    ...(fontSize && { fontSize }),
    ...extraStyle,
  };

  return (
    <Tag className={className} style={inline} {...rest}>
      {children}
    </Tag>
  );
};

export default Txt;
