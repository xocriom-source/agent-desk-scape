import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, Lightbulb, RectangleHorizontal, Radio, Diamond, ChevronDown } from "lucide-react";

const AD_FORMATS = [
  { id: "plane", label: "AVIÃO", icon: Plane, desc: "Voa por toda a cidade" },
  { id: "led", label: "LED WRAP", icon: Lightbulb, desc: "Faixa luminosa nos prédios" },
  { id: "billboard", label: "BILLBOARD", icon: RectangleHorizontal, desc: "Painel no topo dos edifícios" },
  { id: "rooftop", label: "ROOFTOP", icon: Radio, desc: "Transmissão do topo" },
  { id: "blimp", label: "BLIMP", icon: Diamond, desc: "Dirigível flutuante" },
];

const DURATIONS = [
  { label: "1 SEMANA", value: "week" },
  { label: "1 MÊS", value: "month" },
];

const CURRENCIES = [
  { label: "USD", value: "usd" },
  { label: "BRL", value: "brl" },
];

const PRICES: Record<string, Record<string, number>> = {
  week: { usd: 65, brl: 65 },
  month: { usd: 245, brl: 245 },
};

const FAQ = [
  { q: "Quantas pessoas verão meu anúncio?", a: "Todos os usuários ativos na cidade verão seu anúncio durante o período contratado. Em média, ~29K impressões/mês." },
  { q: "Quais formatos estão disponíveis?", a: "Avião, LED Wrap, Billboard, Rooftop e Blimp. Cada formato tem visibilidade e posicionamento únicos." },
  { q: "Posso alterar meu anúncio depois de comprar?", a: "Sim! Você pode editar texto, cores e link a qualquer momento no painel de anúncios." },
  { q: "Como eu pago?", a: "Aceitamos cartão de crédito (assinatura mensal com renovação automática) e Pix (pagamento único por 30 dias)." },
  { q: "E se eu quiser cancelar?", a: "Cancele a qualquer momento no painel. Sem multas ou taxas adicionais." },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CityAdPlacement({ isOpen, onClose }: Props) {
  const [format, setFormat] = useState("plane");
  const [duration, setDuration] = useState("month");
  const [currency, setCurrency] = useState("brl");
  const [brandName, setBrandName] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [textColor, setTextColor] = useState("#F8D880");
  const [bgColor, setBgColor] = useState("#1A1018");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const price = PRICES[duration]?.[currency] || 245;
  const currSymbol = currency === "brl" ? "R$" : "$";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#2A2A20] bg-[#0D0E0A] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <button onClick={onClose} className="text-gray-500 hover:text-white text-xs tracking-wider" style={{ fontFamily: "monospace" }}>
                ← VOLTAR À CIDADE
              </button>
              <button onClick={onClose} className="text-gray-500 hover:text-white text-xs tracking-wider" style={{ fontFamily: "monospace" }}>
                ENTRAR
              </button>
            </div>

            {/* Live Preview */}
            <div className="mx-6 rounded-xl bg-[#0A0B1A] border border-[#1A1A30] aspect-video flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#0A0B2A] to-[#0A0B1A]" />
              <div className="relative flex items-center gap-2">
                <div className="px-3 py-1 rounded border border-[#C8D880] text-[#C8D880] text-xs" style={{ fontFamily: "monospace" }}>
                  /// {brandName || "YOUR BA"}
                </div>
                <div className="w-4 h-3 rounded-sm bg-red-500/60" />
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-[10px] text-gray-500 tracking-wider" style={{ fontFamily: "monospace" }}>
                  LIVE PREVIEW
                </span>
                <br />
                <span className="text-[8px] text-gray-600 tracking-wider" style={{ fontFamily: "monospace" }}>
                  SCROLL: ZOOM · DRAG: ROTATE · RIGHT-DRAG: MOVE
                </span>
              </div>
            </div>

            {/* Format */}
            <div className="px-6 pt-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-gray-400 tracking-widest font-bold" style={{ fontFamily: "monospace" }}>FORMAT</span>
                <span className="text-[10px] text-gray-600 tracking-wider" style={{ fontFamily: "monospace" }}>
                  VOA POR TODA A CIDADE
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {AD_FORMATS.map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        format === f.id
                          ? "border-[#C8D880] bg-[#C8D880]/5"
                          : "border-gray-800 hover:border-gray-600 bg-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${format === f.id ? "text-[#C8D880]" : "text-gray-500"}`} />
                      <span className={`text-[9px] font-bold tracking-wider ${format === f.id ? "text-[#C8D880]" : "text-gray-500"}`}
                        style={{ fontFamily: "monospace" }}
                      >
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-600 mt-2" style={{ fontFamily: "monospace" }}>
                ~29K IMPRESSÕES/MO · 1.0% CTR · ~299 CLICKS/MO
              </p>
            </div>

            {/* Duration & Currency */}
            <div className="px-6 pt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 tracking-widest font-bold block mb-2" style={{ fontFamily: "monospace" }}>
                  DURATION
                </span>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={`px-4 py-1.5 text-[10px] font-bold tracking-wider rounded-md border-2 transition-all ${
                        duration === d.value
                          ? "border-[#C8D880] text-[#C8D880] bg-[#C8D880]/5"
                          : "border-gray-800 text-gray-500 hover:border-gray-600"
                      }`}
                      style={{ fontFamily: "monospace" }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="flex gap-1 mb-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCurrency(c.value)}
                      className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-md border transition-all ${
                        currency === c.value
                          ? "border-[#C8D880] text-[#C8D880] bg-[#C8D880]/5"
                          : "border-gray-800 text-gray-500 hover:border-gray-600"
                      }`}
                      style={{ fontFamily: "monospace" }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="text-2xl font-black text-white" style={{ fontFamily: "monospace" }}>
                  {currSymbol}{price} <span className="text-xs text-gray-500">/MO</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 pt-6 space-y-4">
              {[
                { label: "BRAND NAME", value: brandName, onChange: setBrandName, max: 40, placeholder: "YOUR BRAND" },
                { label: "BANNER TEXT", value: bannerText, onChange: setBannerText, max: 80, placeholder: "YOUR BRAND MESSAGE HERE", multi: true },
                { label: "DESCRIPTION (OPTIONAL)", value: description, onChange: setDescription, max: 200, placeholder: "SHORT DESCRIPTION SHOWN ON CTA POPUP", multi: true },
                { label: "LINK (OPTIONAL)", value: link, onChange: setLink, max: 200, placeholder: "HTTPS://YOURSITE.COM" },
              ].map((field) => (
                <div key={field.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-gray-400 tracking-widest font-bold" style={{ fontFamily: "monospace" }}>
                      {field.label}
                    </span>
                    <span className="text-[10px] text-gray-600" style={{ fontFamily: "monospace" }}>
                      {field.value.length}/{field.max}
                    </span>
                  </div>
                  {field.multi ? (
                    <textarea
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value.slice(0, field.max))}
                      placeholder={field.placeholder}
                      className="w-full bg-transparent border border-gray-800 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#C8D880] focus:outline-none resize-none"
                      style={{ fontFamily: "monospace" }}
                      rows={3}
                    />
                  ) : (
                    <input
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value.slice(0, field.max))}
                      placeholder={field.placeholder}
                      className="w-full bg-transparent border border-gray-800 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#C8D880] focus:outline-none"
                      style={{ fontFamily: "monospace" }}
                    />
                  )}
                </div>
              ))}

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-gray-400 tracking-widest font-bold block mb-1" style={{ fontFamily: "monospace" }}>
                    TEXT COLOR
                  </span>
                  <div className="flex items-center gap-2 border border-gray-800 rounded-lg px-3 py-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: textColor }} />
                    <input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="bg-transparent text-sm text-white flex-1 focus:outline-none"
                      style={{ fontFamily: "monospace" }}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 tracking-widest font-bold block mb-1" style={{ fontFamily: "monospace" }}>
                    BACKGROUND
                  </span>
                  <div className="flex items-center gap-2 border border-gray-800 rounded-lg px-3 py-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: bgColor }} />
                    <input
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="bg-transparent text-sm text-white flex-1 focus:outline-none"
                      style={{ fontFamily: "monospace" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="px-6 pt-6 space-y-2">
              <button className="w-full py-3.5 rounded-lg text-sm font-bold tracking-wider text-black bg-[#C8D880] hover:bg-[#D8E890] transition-colors"
                style={{ fontFamily: "monospace" }}
              >
                ASSINAR {currSymbol}{price}/MO
              </button>
              <button className="w-full py-3.5 rounded-lg text-sm font-bold tracking-wider text-[#C8D880]/60 border border-[#C8D880]/30 hover:border-[#C8D880]/60 transition-colors"
                style={{ fontFamily: "monospace" }}
              >
                PAGAR {currSymbol}{price} COM PIX
              </button>
              <p className="text-center text-[9px] text-gray-600 pb-2" style={{ fontFamily: "monospace" }}>
                CARTÃO = ASSINATURA MENSAL (AUTO-RENOVA). PIX = PAGAMENTO ÚNICO POR 30 DIAS.
              </p>
            </div>

            {/* FAQ */}
            <div className="px-6 pt-6 pb-8">
              <h2 className="text-2xl font-black text-white mb-4" style={{ fontFamily: "monospace" }}>FAQ</h2>
              <div className="space-y-1">
                {FAQ.map((item, i) => (
                  <div key={i} className="border border-gray-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <span className="text-xs font-bold text-white tracking-wider" style={{ fontFamily: "monospace" }}>
                        {item.q.toUpperCase()}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="px-4 pb-3 text-xs text-gray-400" style={{ fontFamily: "monospace" }}>
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
