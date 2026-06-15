import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_NAME = "Bernardo Arnelli";
const SITE_URL = "https://arnelli.com";
const DEFAULT_IMAGE = "https://storage.googleapis.com/malackath-art-images/artist/portrait.png";
const DEFAULT_DESC = "Pintura contemporánea de Bernardo Arnelli. Obras únicas en acrílico, óleo y técnica mixta. Coleccionable.";

export default function SEO({ title, description, image, url, type = "website" }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Arte contemporáneo`;
  const desc = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMAGE;
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_UY" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      <meta name="twitter:site" content="@malackath_art" />

      {/* Extra */}
      <meta name="author" content={SITE_NAME} />
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
}
