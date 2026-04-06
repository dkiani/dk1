"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createTrade, calculatePnl } from "@/lib/trades";
import { TradeDirection, AssetClass, TimeFrame, SetupGrade, TradingSession, AiReviewMessage } from "@/types";
import { X, Camera, Send, Sparkles } from "lucide-react";

export default function NewTradePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reviewFileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"trade" | "review">("trade");

  const [form, setForm] = useState({
    symbol: "", assetClass: "futures" as AssetClass, direction: "long" as TradeDirection,
    entryPrice: "", exitPrice: "", stopLoss: "", takeProfit: "", quantity: "",
    entryTime: new Date().toISOString().slice(0, 16), exitTime: "",
    strategy: "", setupType: "", setupGrade: "" as SetupGrade | "", session: "" as TradingSession | "",
    timeFrame: "5m" as TimeFrame, tags: "", notes: "", fees: "", account: "",
  });

  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [reviewImageBase64, setReviewImageBase64] = useState<string | null>(null);
  const [reviewMediaType, setReviewMediaType] = useState("image/png");
  const [reviewAnalysis, setReviewAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState<AiReviewMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory, reviewAnalysis]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      setScreenshots((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }

  function removeScreenshot(i: number) {
    setScreenshots((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          if (activeTab === "review") handleReviewImageSelect(file);
          else { const dt = new DataTransfer(); dt.items.add(file); handleFileSelect(dt.files); }
        }
      }
    }
  }

  function handleReviewImageSelect(file: File) {
    setReviewMediaType(file.type || "image/png");
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setReviewImage(dataUrl);
      setReviewImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyzeChart() {
    if (!reviewImageBase64) return;
    setAnalyzing(true); setReviewAnalysis("");
    try {
      const res = await fetch("/api/journal/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: reviewImageBase64, mediaType: reviewMediaType }),
      });
      const reader = res.body?.getReader(); if (!reader) return;
      const decoder = new TextDecoder(); let fullText = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6); if (data === "[DONE]") continue;
            try { const p = JSON.parse(data); if (p.text) { fullText += p.text; setReviewAnalysis(fullText); } } catch {}
          }
        }
      }
      setChatHistory([
        { role: "user", content: "[Chart screenshot uploaded]", timestamp: new Date().toISOString() },
        { role: "assistant", content: fullText, timestamp: new Date().toISOString() },
      ]);
    } catch { setReviewAnalysis("Failed to analyze. Please try again."); }
    setAnalyzing(false);
  }

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUpInput.trim() || sendingFollowUp) return;
    const q = followUpInput.trim(); setFollowUpInput(""); setSendingFollowUp(true);
    const newHist: AiReviewMessage[] = [...chatHistory, { role: "user", content: q, timestamp: new Date().toISOString() }];
    setChatHistory(newHist);
    try {
      const res = await fetch("/api/journal/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: reviewImageBase64, mediaType: reviewMediaType, followUp: q,
          chatHistory: newHist.map((m) => ({ role: m.role, content: m.content === "[Chart screenshot uploaded]" ? "I uploaded a chart for analysis." : m.content })),
        }),
      });
      const reader = res.body?.getReader(); if (!reader) return;
      const decoder = new TextDecoder(); let fullText = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6); if (data === "[DONE]") continue;
            try { const p = JSON.parse(data); if (p.text) { fullText += p.text; setChatHistory([...newHist, { role: "assistant", content: fullText, timestamp: new Date().toISOString() }]); } } catch {}
          }
        }
      }
      setChatHistory([...newHist, { role: "assistant", content: fullText, timestamp: new Date().toISOString() }]);
    } catch {
      setChatHistory([...newHist, { role: "assistant", content: "Failed to respond. Try again.", timestamp: new Date().toISOString() }]);
    }
    setSendingFollowUp(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!user) return; setSaving(true);
    const entry = parseFloat(form.entryPrice), exit = form.exitPrice ? parseFloat(form.exitPrice) : undefined;
    const qty = parseInt(form.quantity), fees = form.fees ? parseFloat(form.fees) : 0;
    const pnl = exit ? calculatePnl(entry, exit, qty, form.direction) - fees : undefined;
    const pnlPercent = pnl && entry ? (pnl / (entry * qty)) * 100 : undefined;
    const result: "win" | "loss" | "breakeven" | undefined = pnl !== undefined ? (pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven") : undefined;
    const screenshotData = previews.map((url) => ({ id: crypto.randomUUID(), url, uploadedAt: new Date().toISOString() }));
    const aiReview = reviewAnalysis ? { imageUrl: reviewImage || "", analysis: reviewAnalysis, chatHistory, createdAt: new Date().toISOString() } : undefined;

    await createTrade({
      userId: user.uid, symbol: form.symbol.toUpperCase(), assetClass: form.assetClass, direction: form.direction,
      status: exit ? "closed" : "open", entryPrice: entry, exitPrice: exit,
      stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
      takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : undefined,
      quantity: qty, entryTime: new Date(form.entryTime).toISOString(),
      exitTime: form.exitTime ? new Date(form.exitTime).toISOString() : undefined,
      pnl, pnlPercent, result, fees, strategy: form.strategy || undefined,
      setupType: form.setupType || undefined,
      setupGrade: form.setupGrade ? (form.setupGrade as SetupGrade) : undefined,
      session: form.session ? (form.session as TradingSession) : undefined,
      timeFrame: form.timeFrame, tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      notes: form.notes || undefined, account: form.account || undefined,
      screenshots: screenshotData.length > 0 ? screenshotData : undefined, aiReview,
    });
    router.push("/journal/trades");
  }

  const inp = "w-full px-4 py-3 bg-bg-input border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[0.85rem] text-text-primary placeholder:text-text-tertiary focus:border-accent-teal/30 focus:shadow-[0_0_0_3px_rgba(45,212,191,0.08)] outline-none transition-all duration-200";
  const lbl = "text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-2";

  return (
    <div className="animate-fade-in" onPaste={handlePaste}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[1.5rem] font-bold tracking-[-0.02em]">Log Trade</h1>
        <div className="flex items-center bg-bg-surface rounded-[12px] p-1 border border-border">
          {(["trade", "review"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-[0.8rem] font-semibold cursor-pointer transition-all duration-200 border-0 rounded-[10px] ${
                activeTab === tab
                  ? "bg-gradient-to-r from-accent-teal to-[#14b8a6] text-text-inverse shadow-[0_2px_8px_rgba(45,212,191,0.2)]"
                  : "bg-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {tab === "trade" ? "Trade Details" : "AI Review"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "trade" ? (
        <div className="max-w-[720px] mx-auto">
          <div className="bg-bg-surface border border-border rounded-[16px] p-6 md:p-8 shadow-[var(--shadow-card)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Entry Time</label><input name="entryTime" type="datetime-local" value={form.entryTime} onChange={handleChange} required className={inp} /></div>
                <div><label className={lbl}>Symbol</label><input name="symbol" value={form.symbol} onChange={handleChange} placeholder="NQ, ES, SPY..." required className={inp} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Direction</label>
                  <div className="flex gap-2">
                    {(["long", "short"] as const).map((dir) => (
                      <button key={dir} type="button" onClick={() => setForm((f) => ({ ...f, direction: dir }))}
                        className={`flex-1 py-3 text-[0.85rem] font-semibold cursor-pointer transition-all duration-200 border rounded-[12px] ${
                          form.direction === dir
                            ? dir === "long" ? "bg-green/10 text-green border-green/30 shadow-[0_0_12px_rgba(34,197,94,0.1)]" : "bg-red/10 text-red border-red/30 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
                            : "bg-transparent border-[rgba(255,255,255,0.06)] text-text-tertiary hover:text-text-secondary hover:border-border-hover"
                        }`}
                      >{dir === "long" ? "▲ " : "▼ "}{dir}</button>
                    ))}
                  </div>
                </div>
                <div><label className={lbl}>Session</label>
                  <select name="session" value={form.session} onChange={handleChange} className={inp}>
                    <option value="">Select...</option><option value="London">London</option><option value="NY AM">NY AM</option><option value="NY PM">NY PM</option><option value="Asia">Asia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Entry Price</label><input name="entryPrice" type="number" step="any" value={form.entryPrice} onChange={handleChange} required className={`${inp} font-mono`} /></div>
                <div><label className={lbl}>Exit Price</label><input name="exitPrice" type="number" step="any" value={form.exitPrice} onChange={handleChange} placeholder="Leave blank if open" className={`${inp} font-mono`} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Stop Loss</label><input name="stopLoss" type="number" step="any" value={form.stopLoss} onChange={handleChange} className={`${inp} font-mono`} /></div>
                <div><label className={lbl}>Take Profit</label><input name="takeProfit" type="number" step="any" value={form.takeProfit} onChange={handleChange} className={`${inp} font-mono`} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Quantity</label><input name="quantity" type="number" value={form.quantity} onChange={handleChange} required className={`${inp} font-mono`} /></div>
                <div><label className={lbl}>Account</label><input name="account" value={form.account} onChange={handleChange} placeholder="e.g. Prop Firm" className={inp} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Setup Type</label><input name="setupType" value={form.setupType} onChange={handleChange} placeholder="BOS, CHoCH, FVG..." className={inp} /></div>
                <div><label className={lbl}>Setup Grade</label>
                  <select name="setupGrade" value={form.setupGrade} onChange={handleChange} className={inp}>
                    <option value="">Select...</option><option value="A+">A+</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Timeframe</label>
                  <select name="timeFrame" value={form.timeFrame} onChange={handleChange} className={inp}>
                    {(["1m","5m","15m","1h","4h","1d","1w"] as TimeFrame[]).map((tf) => <option key={tf} value={tf}>{tf}</option>)}
                  </select>
                </div>
                <div><label className={lbl}>Tags</label><input name="tags" value={form.tags} onChange={handleChange} placeholder="Comma separated" className={inp} /></div>
              </div>

              {/* Screenshot upload */}
              <div>
                <label className={lbl}>Chart Screenshot</label>
                <div onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }}
                  className="border-2 border-dashed border-[rgba(45,212,191,0.15)] rounded-[16px] p-8 text-center cursor-pointer hover:border-accent-teal/30 hover:bg-[rgba(45,212,191,0.02)] transition-all duration-200"
                >
                  <Camera className="w-7 h-7 text-text-tertiary mx-auto mb-2" />
                  <p className="text-[0.85rem] text-text-secondary">Drop chart here, click to upload, or paste (Ctrl+V)</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {previews.map((src, i) => (
                      <div key={i} className="relative group rounded-[12px] overflow-hidden border border-border">
                        <img src={src} alt="" className="w-full h-28 object-cover" />
                        <button type="button" onClick={() => removeScreenshot(i)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-0">
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div><label className={lbl}>Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} placeholder="Why did you take this trade?" className={`${inp} resize-none`} />
              </div>

              {/* P&L Preview */}
              {form.entryPrice && form.exitPrice && form.quantity && (() => {
                const pnl = calculatePnl(parseFloat(form.entryPrice), parseFloat(form.exitPrice), parseInt(form.quantity), form.direction) - (form.fees ? parseFloat(form.fees) : 0);
                return (
                  <div className={`rounded-[12px] p-4 border ${pnl >= 0 ? "bg-green/5 border-green/15" : "bg-red/5 border-red/15"}`}>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-secondary mb-1">Estimated P&L</p>
                    <p className={`text-[1.5rem] font-bold font-mono ${pnl >= 0 ? "text-green" : "text-red"}`}>${pnl.toFixed(2)}</p>
                  </div>
                );
              })()}

              {reviewAnalysis && (
                <div className="rounded-[12px] p-4 border border-accent-teal/20 bg-accent-teal/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-accent-teal" />
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-accent-teal">AI Review Attached</p>
                  </div>
                  <p className="text-[0.8rem] text-text-secondary">Analysis will be saved with this trade.</p>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={saving}
                  className="px-7 py-3 bg-accent text-white text-[0.85rem] font-semibold rounded-[12px] hover:bg-accent-hover shadow-[0_2px_8px_rgba(232,93,58,0.25)] hover:shadow-[var(--shadow-glow-orange)] hover:-translate-y-[1px] transition-all duration-200 cursor-pointer disabled:opacity-40 border-0">
                  {saving ? "Saving..." : "Save Trade"}
                </button>
                <button type="button" onClick={() => router.back()}
                  className="px-7 py-3 bg-transparent border border-border text-text-secondary text-[0.85rem] font-medium rounded-[12px] hover:text-text-primary hover:border-border-hover transition-all duration-200 cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* AI Review Tab */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
            <div>
              <label className={lbl}>Chart Screenshot</label>
              {reviewImage ? (
                <div className="relative group rounded-[16px] overflow-hidden border border-border">
                  <img src={reviewImage} alt="Chart" className="w-full object-contain max-h-[500px]" />
                  <button type="button" onClick={() => { setReviewImage(null); setReviewImageBase64(null); setReviewAnalysis(""); setChatHistory([]); }}
                    className="absolute top-3 right-3 p-2 bg-black/70 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-0">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div onClick={() => reviewFileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) handleReviewImageSelect(f); }}
                  className="border-2 border-dashed border-[rgba(45,212,191,0.15)] rounded-[16px] p-16 text-center cursor-pointer hover:border-accent-teal/30 hover:bg-[rgba(45,212,191,0.02)] transition-all duration-200">
                  <Camera className="w-9 h-9 text-text-tertiary mx-auto mb-3" />
                  <p className="text-[0.9rem] text-text-secondary mb-1">Drop chart screenshot here</p>
                  <p className="text-[0.8rem] text-text-tertiary">or click to browse — paste with Ctrl+V</p>
                </div>
              )}
              <input ref={reviewFileInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReviewImageSelect(f); }} className="hidden" />
              {reviewImage && !analyzing && !reviewAnalysis && (
                <button onClick={handleAnalyzeChart}
                  className="mt-4 w-full py-3.5 bg-gradient-to-r from-accent-teal to-[#14b8a6] text-text-inverse text-[0.85rem] font-semibold rounded-[12px] shadow-[0_2px_12px_rgba(45,212,191,0.2)] hover:shadow-[var(--shadow-glow-teal)] hover:-translate-y-[1px] transition-all duration-200 cursor-pointer border-0">
                  Analyze Execution
                </button>
              )}
            </div>
            <div>
              <label className={lbl}>AI Feedback</label>
              <div className="bg-bg-surface border border-border rounded-[16px] p-5 min-h-[300px] max-h-[500px] overflow-y-auto shadow-[var(--shadow-card)]">
                {analyzing && !reviewAnalysis && <p className="text-accent-teal animate-pulse-subtle">Analyzing your execution...</p>}
                {reviewAnalysis ? (
                  <div className="text-[0.85rem] text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {reviewAnalysis}{analyzing && <span className="inline-block w-1.5 h-4 bg-accent-teal ml-0.5 animate-pulse" />}
                  </div>
                ) : !analyzing && <p className="text-text-tertiary">Upload a chart and click &ldquo;Analyze Execution&rdquo; to get ICT/SMC feedback.</p>}
              </div>
            </div>
          </div>
          {chatHistory.length > 0 && (
            <div>
              <label className={lbl}>Follow-up</label>
              <div className="bg-bg-surface border border-border rounded-[16px] overflow-hidden max-h-[400px] overflow-y-auto shadow-[var(--shadow-card)]">
                {chatHistory.slice(2).map((msg, i) => (
                  <div key={i} className={`px-5 py-4 border-b border-[rgba(255,255,255,0.03)] ${msg.role === "user" ? "bg-bg-elevated" : ""}`}>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary">{msg.role === "user" ? "You" : "AI Coach"}</span>
                    <p className="text-[0.85rem] text-text-secondary mt-1 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
                {sendingFollowUp && <div className="px-5 py-4"><p className="text-accent-teal animate-pulse-subtle">Thinking...</p></div>}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleFollowUp} className="flex gap-2 mt-3">
                <input value={followUpInput} onChange={(e) => setFollowUpInput(e.target.value)} placeholder="Ask a follow-up..." disabled={sendingFollowUp} className={`${inp} flex-1`} />
                <button type="submit" disabled={sendingFollowUp || !followUpInput.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-accent-teal to-[#14b8a6] text-text-inverse rounded-[12px] hover:shadow-[var(--shadow-glow-teal)] transition-all duration-200 cursor-pointer disabled:opacity-40 border-0">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
