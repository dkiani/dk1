"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createTrade, calculatePnl } from "@/lib/trades";
import { TradeDirection, AssetClass, TimeFrame, AiReviewMessage } from "@/types";
import { X, Camera, Send } from "lucide-react";

export default function NewTradePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reviewFileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"trade" | "review">("trade");

  // Trade form state
  const [form, setForm] = useState({
    symbol: "",
    assetClass: "futures" as AssetClass,
    direction: "long" as TradeDirection,
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: "",
    strategy: "",
    timeFrame: "5m" as TimeFrame,
    tags: "",
    notes: "",
    fees: "",
  });

  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // AI Review state
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [reviewImageBase64, setReviewImageBase64] = useState<string | null>(null);
  const [reviewMediaType, setReviewMediaType] = useState<string>("image/png");
  const [reviewAnalysis, setReviewAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState<AiReviewMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, reviewAnalysis]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    setScreenshots((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeScreenshot(index: number) {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          if (activeTab === "review") {
            handleReviewImageSelect(file);
          } else {
            handleFileSelect(createFileList([file]));
          }
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
      // Extract base64 data (remove the data:image/...;base64, prefix)
      const base64 = dataUrl.split(",")[1];
      setReviewImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyzeChart() {
    if (!reviewImageBase64) return;
    setAnalyzing(true);
    setReviewAnalysis("");

    try {
      const res = await fetch("/api/journal/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: reviewImageBase64,
          mediaType: reviewMediaType,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setReviewAnalysis(fullText);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      // Save to chat history
      setChatHistory([
        { role: "user", content: "[Chart screenshot uploaded for analysis]", timestamp: new Date().toISOString() },
        { role: "assistant", content: fullText, timestamp: new Date().toISOString() },
      ]);
    } catch {
      setReviewAnalysis("Failed to analyze chart. Please try again.");
    }
    setAnalyzing(false);
  }

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUpInput.trim() || sendingFollowUp) return;

    const question = followUpInput.trim();
    setFollowUpInput("");
    setSendingFollowUp(true);

    const newHistory: AiReviewMessage[] = [
      ...chatHistory,
      { role: "user", content: question, timestamp: new Date().toISOString() },
    ];
    setChatHistory(newHistory);

    try {
      // Build simplified chat history for API (first message includes the image context)
      const apiHistory = newHistory.map((msg) => ({
        role: msg.role,
        content: msg.content === "[Chart screenshot uploaded for analysis]"
          ? "I uploaded a chart screenshot for analysis."
          : msg.content,
      }));

      const res = await fetch("/api/journal/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: reviewImageBase64,
          mediaType: reviewMediaType,
          followUp: question,
          chatHistory: apiHistory,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setChatHistory([
                  ...newHistory,
                  { role: "assistant", content: fullText, timestamp: new Date().toISOString() },
                ]);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      setChatHistory([
        ...newHistory,
        { role: "assistant", content: fullText, timestamp: new Date().toISOString() },
      ]);
    } catch {
      setChatHistory([
        ...newHistory,
        { role: "assistant", content: "Failed to get response. Please try again.", timestamp: new Date().toISOString() },
      ]);
    }

    setSendingFollowUp(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const entry = parseFloat(form.entryPrice);
    const exit = form.exitPrice ? parseFloat(form.exitPrice) : undefined;
    const qty = parseInt(form.quantity);
    const fees = form.fees ? parseFloat(form.fees) : 0;
    const pnl = exit ? calculatePnl(entry, exit, qty, form.direction) - fees : undefined;
    const pnlPercent = pnl && entry ? (pnl / (entry * qty)) * 100 : undefined;

    const screenshotData = previews.map((url) => ({
      id: crypto.randomUUID(),
      url,
      uploadedAt: new Date().toISOString(),
    }));

    // Include AI review data if available
    const aiReview = reviewAnalysis
      ? {
          imageUrl: reviewImage || "",
          analysis: reviewAnalysis,
          chatHistory,
          createdAt: new Date().toISOString(),
        }
      : undefined;

    await createTrade({
      userId: user.uid,
      symbol: form.symbol.toUpperCase(),
      assetClass: form.assetClass,
      direction: form.direction,
      status: exit ? "closed" : "open",
      entryPrice: entry,
      exitPrice: exit,
      quantity: qty,
      entryTime: new Date(form.entryTime).toISOString(),
      exitTime: form.exitTime ? new Date(form.exitTime).toISOString() : undefined,
      pnl,
      pnlPercent,
      fees,
      strategy: form.strategy || undefined,
      timeFrame: form.timeFrame,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      notes: form.notes || undefined,
      screenshots: screenshotData.length > 0 ? screenshotData : undefined,
      aiReview,
    });

    router.push("/journal/trades");
  }

  const inputClass = "w-full px-3 py-[0.7rem] bg-bg-input border border-border text-[0.75rem] font-light text-text-primary placeholder:text-text-muted focus:border-border-hover outline-none transition-colors duration-300";
  const labelClass = "block text-[0.6rem] font-light uppercase tracking-[0.06em] text-text-muted mb-1.5";

  return (
    <div className="animate-fade-in" onPaste={handlePaste}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[1.1rem] font-normal tracking-[-0.02em]">Log Trade</h1>
        <div className="flex items-center border border-border overflow-hidden">
          {(["trade", "review"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[0.6rem] uppercase tracking-[0.06em] cursor-pointer transition-colors duration-300 border-0 bg-transparent font-light ${
                activeTab === tab
                  ? "bg-btn-bg text-btn-fg font-normal"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab === "trade" ? "Trade Details" : "AI Review"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "trade" ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Symbol + Asset Class */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Symbol</label>
              <input name="symbol" value={form.symbol} onChange={handleChange} placeholder="ES, NQ, SPY..." required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Asset Class</label>
              <select name="assetClass" value={form.assetClass} onChange={handleChange} className={inputClass}>
                <option value="futures">Futures</option>
                <option value="options">Options</option>
                <option value="stocks">Stocks</option>
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
          </div>

          {/* Direction + Time Frame */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Direction</label>
              <div className="flex gap-2">
                {(["long", "short"] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, direction: dir }))}
                    className={`flex-1 py-[0.7rem] text-[0.7rem] uppercase tracking-[0.06em] font-light cursor-pointer transition-colors duration-300 border ${
                      form.direction === dir
                        ? dir === "long"
                          ? "bg-green text-white border-green"
                          : "bg-red text-white border-red"
                        : "bg-transparent border-border text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Time Frame</label>
              <select name="timeFrame" value={form.timeFrame} onChange={handleChange} className={inputClass}>
                {(["1m", "5m", "15m", "1h", "4h", "1d", "1w"] as TimeFrame[]).map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Entry / Exit prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Entry Price</label>
              <input name="entryPrice" type="number" step="any" value={form.entryPrice} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Exit Price</label>
              <input name="exitPrice" type="number" step="any" value={form.exitPrice} onChange={handleChange} placeholder="Leave blank if open" className={inputClass} />
            </div>
          </div>

          {/* Quantity + Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Quantity / Contracts</label>
              <input name="quantity" type="number" value={form.quantity} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fees</label>
              <input name="fees" type="number" step="any" value={form.fees} onChange={handleChange} placeholder="0.00" className={inputClass} />
            </div>
          </div>

          {/* Entry / Exit times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Entry Time</label>
              <input name="entryTime" type="datetime-local" value={form.entryTime} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Exit Time</label>
              <input name="exitTime" type="datetime-local" value={form.exitTime} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Strategy + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Strategy</label>
              <input name="strategy" value={form.strategy} onChange={handleChange} placeholder="Breakout, reversal, trend..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tags</label>
              <input name="tags" value={form.tags} onChange={handleChange} placeholder="Comma separated..." className={inputClass} />
            </div>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className={labelClass}>Chart Screenshots</label>
            <p className="text-[0.65rem] text-text-muted font-light mb-3">
              Drag & drop, click to upload, or paste from clipboard (Ctrl+V)
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFileSelect(e.dataTransfer.files);
              }}
              className="border border-dashed border-border p-8 text-center cursor-pointer hover:border-border-hover transition-colors duration-300"
            >
              <Camera className="w-5 h-5 text-text-muted mx-auto mb-2" />
              <p className="text-[0.75rem] text-text-muted font-light">
                Click or drop chart screenshots here
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-32 object-cover border border-border" />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(i)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer border-0"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Why did you take this trade? What was your setup?"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* P&L Preview */}
          {form.entryPrice && form.exitPrice && form.quantity && (
            <div className="bg-bg-surface border border-border p-6">
              <span className="text-[0.6rem] uppercase tracking-[0.06em] text-text-muted font-light">
                Estimated P&L
              </span>
              <p className={`text-[1.5rem] font-medium mt-1 leading-tight ${
                calculatePnl(parseFloat(form.entryPrice), parseFloat(form.exitPrice), parseInt(form.quantity), form.direction) - (form.fees ? parseFloat(form.fees) : 0) >= 0 ? "text-green" : "text-red"
              }`}>
                ${(calculatePnl(parseFloat(form.entryPrice), parseFloat(form.exitPrice), parseInt(form.quantity), form.direction) - (form.fees ? parseFloat(form.fees) : 0)).toFixed(2)}
              </p>
            </div>
          )}

          {/* AI Review Summary (if done) */}
          {reviewAnalysis && (
            <div className="bg-bg-surface border border-border p-6">
              <span className="text-[0.6rem] uppercase tracking-[0.06em] text-accent font-light">
                AI Review Attached
              </span>
              <p className="text-[0.75rem] text-text-secondary font-light mt-1">
                Chart analysis and {chatHistory.length > 2 ? `${Math.floor(chatHistory.length / 2)} follow-up messages` : "feedback"} will be saved with this trade.
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-[0.7rem] bg-btn-bg text-btn-fg text-[0.7rem] tracking-[0.02em] font-normal hover:opacity-85 transition-opacity duration-300 cursor-pointer disabled:opacity-40 border-0"
            >
              {saving ? "Saving..." : "Save Trade"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-[0.7rem] bg-transparent border border-border text-text-muted text-[0.7rem] tracking-[0.02em] font-light hover:text-text-primary hover:border-border-hover transition-colors duration-300 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* AI Review Tab */
        <div className="space-y-6">
          {/* Chart Upload + Analysis Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Chart Image */}
            <div>
              <label className={labelClass}>Chart Screenshot</label>
              <p className="text-[0.65rem] text-text-muted font-light mb-3">
                Upload or paste a screenshot of your chart with execution marks visible
              </p>

              {reviewImage ? (
                <div className="relative group">
                  <img
                    src={reviewImage}
                    alt="Chart for review"
                    className="w-full border border-border object-contain max-h-[500px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setReviewImage(null);
                      setReviewImageBase64(null);
                      setReviewAnalysis("");
                      setChatHistory([]);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer border-0"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => reviewFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      handleReviewImageSelect(file);
                    }
                  }}
                  className="border border-dashed border-border p-12 text-center cursor-pointer hover:border-border-hover transition-colors duration-300"
                >
                  <Camera className="w-6 h-6 text-text-muted mx-auto mb-3" />
                  <p className="text-[0.75rem] text-text-muted font-light mb-1">
                    Drop chart screenshot here
                  </p>
                  <p className="text-[0.65rem] text-text-muted font-light">
                    or click to browse — paste with Ctrl+V
                  </p>
                </div>
              )}
              <input
                ref={reviewFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleReviewImageSelect(file);
                }}
                className="hidden"
              />

              {reviewImage && !analyzing && !reviewAnalysis && (
                <button
                  onClick={handleAnalyzeChart}
                  className="mt-4 w-full px-5 py-[0.7rem] bg-btn-bg text-btn-fg text-[0.7rem] tracking-[0.02em] font-normal hover:opacity-85 transition-opacity duration-300 cursor-pointer border-0"
                >
                  Analyze Execution
                </button>
              )}
            </div>

            {/* Right: Analysis / Streaming Feedback */}
            <div>
              <label className={labelClass}>AI Feedback</label>
              <div className="border border-border bg-bg-surface min-h-[300px] max-h-[500px] overflow-y-auto p-6">
                {analyzing && !reviewAnalysis && (
                  <p className="text-[0.75rem] text-accent font-light animate-pulse">
                    Analyzing execution...
                  </p>
                )}

                {reviewAnalysis ? (
                  <div className="text-[0.75rem] text-text-secondary font-light leading-relaxed whitespace-pre-wrap">
                    {reviewAnalysis}
                    {analyzing && (
                      <span className="inline-block w-1.5 h-3 bg-accent ml-0.5 animate-pulse" />
                    )}
                  </div>
                ) : !analyzing ? (
                  <p className="text-[0.75rem] text-text-muted font-light">
                    Upload a chart screenshot and click &ldquo;Analyze Execution&rdquo; to get ICT/Smart Money Concepts feedback on your trade.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Follow-up Chat Thread */}
          {chatHistory.length > 0 && (
            <div>
              <label className={labelClass}>Follow-up Questions</label>
              <div className="border border-border bg-bg-surface max-h-[400px] overflow-y-auto">
                {chatHistory.slice(2).map((msg, i) => (
                  <div
                    key={i}
                    className={`px-6 py-4 border-b border-border last:border-b-0 ${
                      msg.role === "user" ? "bg-bg-surface-hover" : ""
                    }`}
                  >
                    <span className="text-[0.55rem] uppercase tracking-[0.06em] text-text-muted font-light">
                      {msg.role === "user" ? "You" : "AI Coach"}
                    </span>
                    <p className="text-[0.75rem] text-text-secondary font-light mt-1 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))}
                {sendingFollowUp && (
                  <div className="px-6 py-4">
                    <span className="text-[0.55rem] uppercase tracking-[0.06em] text-text-muted font-light">
                      AI Coach
                    </span>
                    <p className="text-[0.75rem] text-accent font-light mt-1 animate-pulse">
                      Thinking...
                    </p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleFollowUp} className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  placeholder="Ask a follow-up question about this trade..."
                  disabled={sendingFollowUp}
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="submit"
                  disabled={sendingFollowUp || !followUpInput.trim()}
                  className="px-4 py-[0.7rem] bg-btn-bg text-btn-fg text-[0.7rem] hover:opacity-85 transition-opacity duration-300 cursor-pointer disabled:opacity-40 border-0 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Save with Review */}
          {reviewAnalysis && (
            <div className="bg-bg-surface border border-border p-6">
              <p className="text-[0.75rem] text-text-secondary font-light mb-4">
                Switch to the &ldquo;Trade Details&rdquo; tab to fill in your trade data, then save. The AI review will be attached automatically.
              </p>
              <button
                onClick={() => setActiveTab("trade")}
                className="px-5 py-[0.7rem] bg-btn-bg text-btn-fg text-[0.7rem] tracking-[0.02em] font-normal hover:opacity-85 transition-opacity duration-300 cursor-pointer border-0"
              >
                Go to Trade Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function createFileList(files: File[]): FileList {
  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));
  return dt.files;
}
