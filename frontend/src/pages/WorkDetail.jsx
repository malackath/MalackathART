import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export default function WorkDetail() {
  const { id } = useParams();
  const { t, pick, lang } = useLang();
  const [art, setArt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get(`/artworks/${id}`)
      .then((r) => {
        setArt(r.data);
        setActiveImage(r.data.image_url);
      })
      .catch(() => setArt(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuy = async () => {
    if (!art) return;
    setBuying(true);
    try {
      const res = await api.post("/checkout/session", {
        artwork_id: art.id,
        origin_url: window.location.origin,
      });
      if (res.data.url) window.location.href = res.data.url;
    } catch (e) {
      toast.error(lang === "es" ? "Error iniciando el pago" : "Error starting payment");
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div
        data-testid="detail-loading"
        className="max-w-[1400px] mx-auto px-6 md:px-12 py-32"
        style={{ color: "var(--app-text-muted)" }}
      >
        ···
      </div>
    );
  }

  if (!art) {
    return (
      <div
        className="max-w-[1400px] mx-auto px-6 md:px-12 py-32"
        style={{ color: "var(--app-text-muted)" }}
      >
        404
      </div>
    );
  }

  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div data-testid="detail-page" className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
      <button
        onClick={() => navigate(-1)}
        data-testid="detail-back"
        className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase mb-12 hover:!text-[var(--app-text)]"
        style={{ color: "var(--app-text-soft)" }}
      >
        <ArrowLeft size={14} /> {t.detail.back}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-8 fade-up">
          <div
            className="flex items-center justify-center p-4 md:p-10"
            style={{ backgroundColor: "var(--app-overlay-soft)" }}
          >
            <img
              src={activeImage || art.image_url}
              alt={pick(art, "title")}
              data-testid="detail-image"
              className="max-h-[75vh] w-auto max-w-full object-contain"
            />
          </div>
          {Array.isArray(art.images) && art.images.length > 0 && (
            <div className="mt-6 flex gap-3 flex-wrap" data-testid="detail-gallery">
              {[art.image_url, ...art.images].map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  onClick={() => setActiveImage(url)}
                  data-testid={`detail-thumb-${i}`}
                  className="w-20 h-20 md:w-24 md:h-24 overflow-hidden border-2 transition-all"
                  style={{
                    backgroundColor: "var(--app-overlay)",
                    borderColor:
                      (activeImage || art.image_url) === url
                        ? "var(--app-text)"
                        : "transparent",
                    opacity: (activeImage || art.image_url) === url ? 1 : 0.6,
                  }}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start fade-up-d1">
          <h1
            className="font-display font-black tracking-tighter text-3xl md:text-4xl leading-none"
            style={{ color: "var(--app-text)" }}
          >
            {pick(art, "title")}
          </h1>

          <dl className="mt-10 space-y-5 text-sm">
            {[
              { l: t.detail.year, v: art.year },
              { l: t.detail.technique, v: pick(art, "technique") },
              { l: t.detail.dimensions, v: art.dimensions },
              { l: t.detail.price, v: formatPrice(art.price, art.currency), isPrice: true },
            ]
              .filter((x) => x.v)
              .map((x, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b pb-3"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <dt
                    className="tracking-[0.2em] uppercase text-xs"
                    style={{ color: "var(--app-text-muted)" }}
                  >
                    {x.l}
                  </dt>
                  <dd
                    className={x.isPrice ? "font-display text-lg text-right" : "text-right"}
                    style={{ color: "var(--app-text)" }}
                  >
                    {x.v}
                  </dd>
                </div>
              ))}
          </dl>

          <p
            className="mt-8 text-base leading-relaxed"
            style={{ color: "var(--app-text-soft)" }}
          >
            {pick(art, "description")}
          </p>
          <p
            className="mt-4 text-xs italic"
            style={{ color: "var(--app-text-muted)" }}
          >
            {t.detail.certificate}
          </p>

          {art.available ? (
            <button
              onClick={handleBuy}
              disabled={buying}
              data-testid="buy-artwork-button"
              className="mt-10 w-full inline-flex items-center justify-center gap-3 px-7 py-4 text-sm tracking-[0.2em] uppercase font-bold transition-colors disabled:opacity-50"
              style={{
                backgroundColor: "var(--app-invert)",
                color: "var(--app-invert-text)",
                border: "1px solid var(--app-invert)",
              }}
            >
              {buying ? t.detail.buying : t.detail.buy}
              {!buying && <ArrowUpRight size={16} />}
            </button>
          ) : (
            <div
              data-testid="sold-banner"
              className="mt-10 w-full px-7 py-4 border text-sm tracking-[0.2em] uppercase text-center"
              style={{
                color: "var(--app-text-muted)",
                borderColor: "var(--app-border-strong)",
              }}
            >
              {t.detail.sold}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
