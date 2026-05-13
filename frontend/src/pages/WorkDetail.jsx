import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      toast.error(lang === "es" ? "Error iniciando el pago" : "Error starting payment");
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div data-testid="detail-loading" className="max-w-[1400px] mx-auto px-6 md:px-12 py-32 text-white/50">
        ···
      </div>
    );
  }

  if (!art) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-32 text-white/50">
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
        className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-white/60 hover:text-white mb-12"
      >
        <ArrowLeft size={14} /> {t.detail.back}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-8 fade-up">
          <div className="bg-white/[0.03] flex items-center justify-center p-4 md:p-10">
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
                  className={`w-20 h-20 md:w-24 md:h-24 overflow-hidden bg-white/5 border transition-all ${
                    (activeImage || art.image_url) === url
                      ? "border-white"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start fade-up-d1">
          <h1 className="font-display tracking-tighter text-3xl md:text-4xl leading-none">
            {pick(art, "title")}
          </h1>

          <dl className="mt-10 space-y-5 text-sm">
            <div className="flex justify-between border-b border-white/10 pb-3">
              <dt className="text-white/40 tracking-[0.2em] uppercase text-xs">{t.detail.year}</dt>
              <dd className="text-white">{art.year}</dd>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-3">
              <dt className="text-white/40 tracking-[0.2em] uppercase text-xs">{t.detail.technique}</dt>
              <dd className="text-white text-right">{pick(art, "technique")}</dd>
            </div>
            {art.dimensions && (
              <div className="flex justify-between border-b border-white/10 pb-3">
                <dt className="text-white/40 tracking-[0.2em] uppercase text-xs">{t.detail.dimensions}</dt>
                <dd className="text-white">{art.dimensions}</dd>
              </div>
            )}
            <div className="flex justify-between border-b border-white/10 pb-3">
              <dt className="text-white/40 tracking-[0.2em] uppercase text-xs">{t.detail.price}</dt>
              <dd className="text-white font-display text-lg">
                {formatPrice(art.price, art.currency)}
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-sm leading-relaxed text-white/70">
            {pick(art, "description")}
          </p>
          <p className="mt-4 text-xs text-white/40 italic">{t.detail.certificate}</p>

          {art.available ? (
            <button
              onClick={handleBuy}
              disabled={buying}
              data-testid="buy-artwork-button"
              className="mt-10 w-full inline-flex items-center justify-center gap-3 px-7 py-4 border border-white text-sm tracking-[0.2em] uppercase bg-white text-black hover:bg-transparent hover:text-white transition-colors disabled:opacity-50"
            >
              {buying ? t.detail.buying : t.detail.buy}
              {!buying && <ArrowUpRight size={16} />}
            </button>
          ) : (
            <div
              data-testid="sold-banner"
              className="mt-10 w-full px-7 py-4 border border-white/20 text-sm tracking-[0.2em] uppercase text-white/40 text-center"
            >
              {t.detail.sold}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
