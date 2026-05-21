import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Calendar, Clock, GripVertical, Image as ImageIcon, Layers, MapPin, Phone, RotateCw, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CANVAS_BG_CATEGORY_LABEL,
  CANVAS_BG_PRESETS,
  canvasPresetById,
  type CanvasBgCategory,
} from "@/lib/denemeCanvasBackgrounds";
import { denemeTarihEtiketi } from "@/lib/denemeOrnekVeri";
import {
  autoFixSceneLayout,
  buildSceneFromFormData,
  clampElementRect,
  defaultPieceForType,
  FONT_STACK_CSS,
  initialPosterScene,
  type FontStackId,
  PIECE_PALETTE,
  pieceSupportsTextChrome,
  type PlacedElement,
  type PlacedPieceType,
  type PosterSceneState,
  snapRotationDeg,
  snapScenePosition,
  type TextAlign,
} from "@/lib/denemePosterScene";
import type { DenemeSinaviFormData } from "@/types/denemeSinavi";
import { afisGorselDizisi, sinifBadgeMetni } from "@/types/denemeSinavi";
import { cn } from "@/lib/utils";
import { KayitQrImage } from "./KayitQrImage";

export const SCENE_DND_MIME = "application/x-tedris-piece";

const SCENE_ELEMENT_Z_BASE = 10;

function pieceIcon(t: PlacedPieceType) {
  switch (t) {
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    case "title":
    case "subtitle":
    case "free_text":
      return <Type className="h-4 w-4" />;
    default:
      return <Layers className="h-4 w-4" />;
  }
}

function canvasBgStyle(scene: PosterSceneState): CSSProperties {
  const cb = scene.canvasBackground;
  const opacity = Math.min(1, Math.max(0.15, cb.opacity));
  const blur = Math.max(0, Math.min(24, cb.blurPx));
  const filter = blur > 0 ? `blur(${blur}px)` : undefined;
  if (cb.customImageUrl) {
    return {
      opacity,
      filter,
      backgroundImage: `url(${cb.customImageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  const preset = canvasPresetById(cb.presetId);
  return {
    opacity,
    filter,
    background: preset?.css ?? "#f8fafc",
  };
}

function TextChromeWrap({ el, children }: { el: PlacedElement; children: ReactNode }) {
  const st = el.style;
  if (!pieceSupportsTextChrome(el.type)) return <>{children}</>;
  const ra = st.textRadius ?? "sm";
  const rad = ra === "none" ? "rounded-none" : ra === "round" ? "rounded-full" : "rounded-md";
  return (
    <div
      className={cn("h-full w-full overflow-hidden p-1.5", rad, st.textShadowEnabled && "shadow-md")}
      style={{
        backgroundColor: st.textBgEnabled ? (st.textBoxBgColor ?? "rgba(255,255,255,0.92)") : "transparent",
        borderWidth: st.textBorderEnabled ? 1 : 0,
        borderStyle: st.textBorderEnabled ? "solid" : "none",
        borderColor: st.textBorderEnabled ? (st.textBoxBorderColor ?? "rgba(15,23,42,0.25)") : "transparent",
      }}
    >
      {children}
    </div>
  );
}

function PlacedContent({ el, data }: { el: PlacedElement; data: DenemeSinaviFormData }) {
  const st = el.style;
  const fs = st.fontSize ?? 12;
  const ff = FONT_STACK_CSS[st.fontStack ?? "inter"];
  const fw = st.fontWeight === "bold" ? 700 : 400;
  const col = st.color ?? "#0f172a";
  const ta = st.textAlign ?? "center";
  const urls = afisGorselDizisi(data);

  const textStyle: CSSProperties = {
    fontFamily: ff,
    fontSize: fs,
    fontWeight: fw,
    color: col,
    textAlign: ta,
    lineHeight: 1.2,
    wordBreak: "break-word",
  };

  switch (el.type) {
    case "title":
      return (
        <TextChromeWrap el={el}>
          <p style={{ ...textStyle, fontSize: fs + 4 }}>{st.text ?? data.baslik}</p>
        </TextChromeWrap>
      );
    case "subtitle":
      return (
        <TextChromeWrap el={el}>
          <p style={textStyle}>{st.text ?? (data.duyuruMetni.trim() ? data.duyuruMetni.slice(0, 120) : "Alt başlık")}</p>
        </TextChromeWrap>
      );
    case "datetime": {
      const line =
        st.text?.trim() ||
        `${data.tarih ? denemeTarihEtiketi(data.tarih) : "—"}${data.saat ? ` · ${data.saat}` : ""}`;
      return (
        <TextChromeWrap el={el}>
          <p style={textStyle} className="flex flex-wrap items-center justify-center gap-1">
            <Calendar className="h-3 w-3 shrink-0 opacity-90" />
            {line}
          </p>
        </TextChromeWrap>
      );
    }
    case "class_level":
      return (
        <TextChromeWrap el={el}>
          <p style={textStyle}>{st.text ?? sinifBadgeMetni(data)}</p>
        </TextChromeWrap>
      );
    case "reward": {
      const frame =
        st.frameType === "ring"
          ? "ring-2 ring-amber-300/60"
          : st.frameType === "none"
            ? ""
            : "rounded-xl border border-white/20";
      return (
        <div className={cn("flex h-full w-full flex-col justify-center overflow-hidden p-1 text-center", frame)}>
          <p style={textStyle} className="font-bold">
            {st.rewardTitle ?? data.oduller[0]?.title ?? "Ödül"}
          </p>
          {(st.rewardDescription ?? data.oduller[0]?.description) ? (
            <p style={{ ...textStyle, fontSize: Math.max(9, fs - 2) }} className="mt-0.5 opacity-90">
              {st.rewardDescription ?? data.oduller[0]?.description}
            </p>
          ) : null}
          {(st.rewardImage ?? data.oduller[0]?.image) ? (
            <img src={st.rewardImage ?? data.oduller[0]?.image} alt="" className="mx-auto mt-1 max-h-[36%] max-w-full rounded object-contain" />
          ) : null}
        </div>
      );
    }
    case "qr": {
      const url = (st.qrUrl ?? data.kayitQrUrl).trim();
      const px = Math.min(160, Math.max(48, st.qrSize ?? 72));
      if (!url) return <p style={textStyle}>Kayıt linki ekleyin</p>;
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-0.5">
          <KayitQrImage url={url} size={px} className="rounded bg-white p-0.5" />
          <p style={{ ...textStyle, fontSize: 9 }}>{st.qrCta ?? "QR Tara · Hemen Başvur"}</p>
        </div>
      );
    }
    case "cta":
      return (
        <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-2 text-center font-black text-slate-900 shadow-md" style={{ fontSize: fs }}>
          {st.text ?? "Hemen başvur"}
        </div>
      );
    case "contact":
      return (
        <TextChromeWrap el={el}>
          <div style={textStyle} className="space-y-0.5 text-left text-[10px]">
            {st.text?.trim() ? (
              <p className="whitespace-pre-wrap">{st.text}</p>
            ) : (
              <>
                {data.telefon ? (
                  <p className="flex items-center gap-1">
                    <Phone className="h-3 w-3 shrink-0" /> {data.telefon}
                  </p>
                ) : null}
                {data.adres ? (
                  <p className="flex items-start gap-1">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> <span className="line-clamp-4">{data.adres}</span>
                  </p>
                ) : null}
                {!data.telefon && !data.adres ? <p>İletişim bilgisi</p> : null}
              </>
            )}
          </div>
        </TextChromeWrap>
      );
    case "logo":
      return (
        <div className="flex h-full w-full items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-300/40 bg-white/80">
            {data.kurumLogo ? <img src={data.kurumLogo} alt="" className="h-full w-full object-contain" /> : <Sparkles className="h-4 w-4 text-slate-500" />}
          </div>
          <p style={{ ...textStyle, fontSize: fs - 1 }} className="min-w-0 truncate text-left font-bold">
            {data.kurumAdi}
          </p>
        </div>
      );
    case "image":
      return urls[0] ? (
        <img src={urls[0]} alt="" className="h-full w-full rounded-lg object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-400/50 bg-slate-100/50 text-[9px] text-slate-500">
          <ImageIcon className="h-6 w-6 opacity-60" />
          <span>Forma görsel ekleyin</span>
        </div>
      );
    case "free_text":
    default:
      return (
        <TextChromeWrap el={el}>
          <p style={textStyle}>{st.text ?? "Serbest metin"}</p>
        </TextChromeWrap>
      );
  }
}

type ResizeCorner = "nw" | "ne" | "sw" | "se";

export function DenemePosterSceneEditor({
  data,
  scene,
  onSceneChange,
  variant,
  desktop,
}: {
  data: DenemeSinaviFormData;
  scene: PosterSceneState;
  onSceneChange: Dispatch<SetStateAction<PosterSceneState>>;
  variant: "live" | "export";
  desktop: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const exportMode = variant === "export";
  const showChrome = !exportMode && scene.editMode && desktop;
  const useStage = scene.elements.length > 0 || (scene.editMode && desktop);
  const [bgCat, setBgCat] = useState<CanvasBgCategory | "hepsi">("hepsi");

  const updateEl = useCallback(
    (id: string, patch: Partial<PlacedElement>) => {
      onSceneChange((sc) => ({
        ...sc,
        elements: sc.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },
    [onSceneChange],
  );

  const deleteEl = useCallback(
    (id: string) => {
      onSceneChange((sc) => ({
        ...sc,
        elements: sc.elements.filter((e) => e.id !== id),
        selectedId: sc.selectedId === id ? null : sc.selectedId,
      }));
    },
    [onSceneChange],
  );

  const bring = useCallback(
    (id: string, dir: 1 | -1) => {
      onSceneChange((sc) => {
        const sorted = [...sc.elements].sort((a, b) => a.zIndex - b.zIndex);
        const i = sorted.findIndex((e) => e.id === id);
        const j = i + dir;
        if (j < 0 || j >= sorted.length) return sc;
        const a = sorted[i];
        const b = sorted[j];
        return {
          ...sc,
          elements: sc.elements.map((e) => {
            if (e.id === a.id) return { ...e, zIndex: b.zIndex };
            if (e.id === b.id) return { ...e, zIndex: a.zIndex };
            return e;
          }),
        };
      });
    },
    [onSceneChange],
  );

  const sortedEls = useMemo(() => [...scene.elements].sort((a, b) => a.zIndex - b.zIndex), [scene.elements]);

  const allowSceneDrop = useCallback(
    (e: React.DragEvent) => {
      if (!showChrome || exportMode) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [exportMode, showChrome],
  );

  const onDropStage = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!desktop || exportMode || !stageRef.current) return;
      let type: PlacedPieceType | null = null;
      try {
        let raw = e.dataTransfer.getData(SCENE_DND_MIME);
        if (!raw) raw = e.dataTransfer.getData("text/plain");
        if (raw) type = JSON.parse(raw).type as PlacedPieceType;
      } catch {
        return;
      }
      if (!type) return;
      const r = stageRef.current.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const xp = ((e.clientX - r.left) / r.width) * 100;
      const yp = ((e.clientY - r.top) / r.height) * 100;
      onSceneChange((sc) => {
        const z = sc.zCounter + 1;
        const piece = defaultPieceForType(type!, z, xp, yp);
        return {
          ...sc,
          elements: [...sc.elements, piece],
          selectedId: piece.id,
          zCounter: z,
        };
      });
    },
    [desktop, exportMode, onSceneChange],
  );

  const canvasDropHandlers =
    showChrome && !exportMode
      ? {
          onDragOver: allowSceneDrop,
          onDrop: onDropStage,
        }
      : {};

  const [drag, setDrag] = useState<{ id: string; cx: number; cy: number; ex: number; ey: number } | null>(null);
  const [resize, setResize] = useState<{ id: string; corner: ResizeCorner; cx: number; cy: number; ex: number; ey: number; ew: number; eh: number } | null>(null);
  const [rotate, setRotate] = useState<{ id: string; cx: number; cy: number; base: number; elcx: number; elcy: number } | null>(null);

  useEffect(() => {
    if (!drag || exportMode || !stageRef.current) return;
    const move = (e: PointerEvent) => {
      const r = stageRef.current!.getBoundingClientRect();
      onSceneChange((sc) => {
        const el = sc.elements.find((x) => x.id === drag.id);
        if (!el || el.locked) return sc;
        const nx = drag.ex + ((e.clientX - drag.cx) / r.width) * 100;
        const ny = drag.ey + ((e.clientY - drag.cy) / r.height) * 100;
        const raw = clampElementRect(nx, ny, el.width, el.height);
        const others = sc.elements.filter((x) => x.id !== el.id);
        const sn = snapScenePosition({ ...el, x: raw.x, y: raw.y }, others, r.width, r.height);
        return {
          ...sc,
          elements: sc.elements.map((x) => (x.id === el.id ? { ...x, x: sn.x, y: sn.y } : x)),
        };
      });
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, exportMode, onSceneChange]);

  useEffect(() => {
    if (!resize || exportMode || !stageRef.current) return;
    const move = (e: PointerEvent) => {
      const r = stageRef.current!.getBoundingClientRect();
      const dx = ((e.clientX - resize.cx) / r.width) * 100;
      const dy = ((e.clientY - resize.cy) / r.height) * 100;
      const c = resize.corner;
      onSceneChange((sc) => {
        const el = sc.elements.find((x) => x.id === resize.id);
        if (!el || el.locked) return sc;
        let nx = resize.ex;
        let ny = resize.ey;
        let nw = resize.ew;
        let nh = resize.eh;
        if (c === "se") {
          nw = resize.ew + dx;
          nh = resize.eh + dy;
        } else if (c === "ne") {
          nw = resize.ew + dx;
          nh = resize.eh - dy;
          ny = resize.ey + dy;
        } else if (c === "sw") {
          nw = resize.ew - dx;
          nh = resize.eh + dy;
          nx = resize.ex + dx;
        } else {
          nw = resize.ew - dx;
          nh = resize.eh - dy;
          nx = resize.ex + dx;
          ny = resize.ey + dy;
        }
        const cl = clampElementRect(nx, ny, nw, nh);
        return {
          ...sc,
          elements: sc.elements.map((x) => (x.id === el.id ? { ...x, x: cl.x, y: cl.y, width: cl.w, height: cl.h } : x)),
        };
      });
    };
    const up = () => setResize(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [resize, exportMode, onSceneChange]);

  useEffect(() => {
    if (!rotate || exportMode) return;
    const rid = rotate.id;
    const move = (e: PointerEvent) => {
      const a1 = Math.atan2(rotate.cy - rotate.elcy, rotate.cx - rotate.elcx);
      const a2 = Math.atan2(e.clientY - rotate.elcy, e.clientX - rotate.elcx);
      const deg = rotate.base + ((a2 - a1) * 180) / Math.PI;
      onSceneChange((sc) => {
        const el = sc.elements.find((x) => x.id === rid);
        if (!el || el.locked) return sc;
        return {
          ...sc,
          elements: sc.elements.map((x) => (x.id === el.id ? { ...x, rotation: deg } : x)),
        };
      });
    };
    const up = () => {
      onSceneChange((sc) => {
        const el = sc.elements.find((x) => x.id === rid);
        if (!el) return sc;
        return {
          ...sc,
          elements: sc.elements.map((x) => (x.id === el.id ? { ...x, rotation: snapRotationDeg(el.rotation) } : x)),
        };
      });
      setRotate(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [rotate, exportMode, onSceneChange]);

  const selected = scene.elements.find((e) => e.id === scene.selectedId);

  const filteredPresets = useMemo(() => {
    if (bgCat === "hepsi") return CANVAS_BG_PRESETS;
    return CANVAS_BG_PRESETS.filter((p) => p.category === bgCat);
  }, [bgCat]);

  const onCustomBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      if (url)
        onSceneChange((sc) => ({
          ...sc,
          canvasBackground: { ...sc.canvasBackground, customImageUrl: url, presetId: null },
        }));
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const propsPanel =
    showChrome && selected ? (
      <div className="mt-2 w-full space-y-2 rounded-xl border border-slate-200 bg-white p-2 text-[10px] shadow-sm">
        <p className="font-bold text-slate-800">Öğe ayarı</p>
        <div className="flex flex-wrap gap-1">
          <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => bring(selected.id, 1)}>
            Öne
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => bring(selected.id, -1)}>
            Arkaya
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => updateEl(selected.id, { locked: !selected.locked })}>
            {selected.locked ? "Kilidi aç" : "Kilitle"}
          </Button>
          <Button type="button" size="sm" variant="destructive" className="h-7 text-[10px]" onClick={() => deleteEl(selected.id)}>
            Sil
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Label className="shrink-0">Döndür (°)</Label>
          <Input
            type="number"
            className="h-8 text-xs"
            value={Math.round(selected.rotation * 10) / 10}
            onChange={(e) => updateEl(selected.id, { rotation: Number(e.target.value) || 0 })}
          />
        </div>
        {pieceSupportsTextChrome(selected.type) ? (
          <>
            <Label>Metin</Label>
            <Input
              className="h-8 text-xs"
              value={selected.style.text ?? ""}
              placeholder={selected.type === "datetime" ? "Boş bırak: formdan al" : ""}
              onChange={(e) => updateEl(selected.id, { style: { ...selected.style, text: e.target.value } })}
            />
            <Label>Font</Label>
            <Select
              value={selected.style.fontStack ?? "inter"}
              onValueChange={(v) => updateEl(selected.id, { style: { ...selected.style, fontStack: v as FontStackId } })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="poppins">Poppins</SelectItem>
                <SelectItem value="montserrat">Montserrat</SelectItem>
                <SelectItem value="oswald">Oswald</SelectItem>
                <SelectItem value="display">Güçlü başlık (Impact benzeri)</SelectItem>
                <SelectItem value="georgia">Georgia</SelectItem>
                <SelectItem value="arial">Arial</SelectItem>
                <SelectItem value="serif_generic">Serif</SelectItem>
                <SelectItem value="sans_generic">Sans</SelectItem>
                <SelectItem value="condensed">Condensed</SelectItem>
              </SelectContent>
            </Select>
            <Label>Boyut</Label>
            <Input
              type="number"
              className="h-8 text-xs"
              value={selected.style.fontSize ?? 12}
              onChange={(e) => updateEl(selected.id, { style: { ...selected.style, fontSize: Number(e.target.value) || 12 } })}
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={selected.style.fontWeight === "bold"}
                onChange={(e) => updateEl(selected.id, { style: { ...selected.style, fontWeight: e.target.checked ? "bold" : "normal" } })}
              />
              Kalın
            </label>
            <Label>Renk</Label>
            <Input
              type="color"
              className="h-8 w-full"
              value={selected.style.color?.startsWith("#") ? selected.style.color : "#0f172a"}
              onChange={(e) => updateEl(selected.id, { style: { ...selected.style, color: e.target.value } })}
            />
            <Label>Hiza</Label>
            <Select
              value={selected.style.textAlign ?? "center"}
              onValueChange={(v) => updateEl(selected.id, { style: { ...selected.style, textAlign: v as TextAlign } })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Sol</SelectItem>
                <SelectItem value="center">Orta</SelectItem>
                <SelectItem value="right">Sağ</SelectItem>
              </SelectContent>
            </Select>
            <Label className="text-slate-600">Kutu / çerçeve</Label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={!!selected.style.textBgEnabled}
                onChange={(e) => updateEl(selected.id, { style: { ...selected.style, textBgEnabled: e.target.checked } })}
              />
              Arka plan
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={!!selected.style.textBorderEnabled}
                onChange={(e) => updateEl(selected.id, { style: { ...selected.style, textBorderEnabled: e.target.checked } })}
              />
              Çerçeve
            </label>
            <Label>Köşe</Label>
            <Select
              value={selected.style.textRadius ?? "sm"}
              onValueChange={(v) => updateEl(selected.id, { style: { ...selected.style, textRadius: v as "none" | "sm" | "round" } })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Yok</SelectItem>
                <SelectItem value="sm">Az</SelectItem>
                <SelectItem value="round">Yuvarlak</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={!!selected.style.textShadowEnabled}
                onChange={(e) => updateEl(selected.id, { style: { ...selected.style, textShadowEnabled: e.target.checked } })}
              />
              Gölge
            </label>
          </>
        ) : null}
        {selected.type === "reward" ? (
          <>
            <Label>Ödül adı</Label>
            <Input
              className="h-8 text-xs"
              value={selected.style.rewardTitle ?? ""}
              onChange={(e) => updateEl(selected.id, { style: { ...selected.style, rewardTitle: e.target.value } })}
            />
            <Label>Açıklama</Label>
            <Input
              className="h-8 text-xs"
              value={selected.style.rewardDescription ?? ""}
              onChange={(e) => updateEl(selected.id, { style: { ...selected.style, rewardDescription: e.target.value } })}
            />
            <Label>Çerçeve</Label>
            <Select
              value={selected.style.frameType ?? "rounded"}
              onValueChange={(v) => updateEl(selected.id, { style: { ...selected.style, frameType: v as "none" | "rounded" | "ring" } })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Yok</SelectItem>
                <SelectItem value="rounded">Yuvarlak</SelectItem>
                <SelectItem value="ring">Halka</SelectItem>
              </SelectContent>
            </Select>
          </>
        ) : null}
        {selected.type === "qr" ? (
          <>
            <Label>Link</Label>
            <Input
              className="h-8 text-xs"
              value={selected.style.qrUrl ?? data.kayitQrUrl}
              onChange={(e) => updateEl(selected.id, { style: { ...selected.style, qrUrl: e.target.value } })}
            />
            <Label>CTA</Label>
            <Input
              className="h-8 text-xs"
              value={selected.style.qrCta ?? ""}
              onChange={(e) => updateEl(selected.id, { style: { ...selected.style, qrCta: e.target.value } })}
            />
            <Label>QR boyutu</Label>
            <Input
              type="number"
              className="h-8 text-xs"
              value={selected.style.qrSize ?? 72}
              onChange={(e) => updateEl(selected.id, { style: { ...selected.style, qrSize: Number(e.target.value) || 72 } })}
            />
          </>
        ) : null}
      </div>
    ) : null;

  if (!useStage) {
    return null;
  }

  const bgPanel = showChrome ? (
    <div className="space-y-2 border-b border-slate-200 pb-2">
      <p className="text-center text-[10px] font-extrabold text-slate-800">Arka plan</p>
      <Select value={bgCat} onValueChange={(v) => setBgCat(v as CanvasBgCategory | "hepsi")}>
        <SelectTrigger className="h-8 text-[10px]">
          <SelectValue placeholder="Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hepsi">Tümü</SelectItem>
          {(Object.keys(CANVAS_BG_CATEGORY_LABEL) as CanvasBgCategory[]).map((c) => (
            <SelectItem key={c} value={c}>
              {CANVAS_BG_CATEGORY_LABEL[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="grid max-h-36 grid-cols-3 gap-1 overflow-y-auto pr-0.5">
        {filteredPresets.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.label}
            onClick={() =>
              onSceneChange((sc) => ({
                ...sc,
                canvasBackground: { ...sc.canvasBackground, presetId: p.id, customImageUrl: null },
              }))
            }
            className={cn(
              "aspect-square rounded-md border-2 shadow-sm transition hover:opacity-95",
              scene.canvasBackground.presetId === p.id && !scene.canvasBackground.customImageUrl ? "border-indigo-600 ring-1 ring-indigo-300" : "border-transparent",
            )}
            style={{ background: p.css }}
          />
        ))}
      </div>
      <label className="flex cursor-pointer flex-col gap-0.5">
        <span className="text-[9px] font-semibold text-slate-600">Kendi görselin</span>
        <Input type="file" accept="image/*" className="h-8 cursor-pointer text-[9px]" onChange={onCustomBgFile} />
      </label>
      {scene.canvasBackground.customImageUrl ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-full text-[9px]"
          onClick={() => onSceneChange((sc) => ({ ...sc, canvasBackground: { ...sc.canvasBackground, customImageUrl: null, presetId: "paper-white" } }))}
        >
          Ön tanımlıya dön
        </Button>
      ) : null}
      <div>
        <Label className="text-[9px]">Opaklık</Label>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={scene.canvasBackground.opacity}
          className="w-full"
          onChange={(e) =>
            onSceneChange((sc) => ({
              ...sc,
              canvasBackground: { ...sc.canvasBackground, opacity: Number(e.target.value) },
            }))
          }
        />
      </div>
      <div>
        <Label className="text-[9px]">Bulanıklık (px)</Label>
        <input
          type="range"
          min={0}
          max={16}
          step={1}
          value={scene.canvasBackground.blurPx}
          className="w-full"
          onChange={(e) =>
            onSceneChange((sc) => ({
              ...sc,
              canvasBackground: { ...sc.canvasBackground, blurPx: Number(e.target.value) },
            }))
          }
        />
      </div>
    </div>
  ) : null;

  const palette = showChrome ? (
    <aside className="flex w-[13.5rem] shrink-0 flex-col gap-2 self-stretch overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      {bgPanel}
      <p className="text-center text-[11px] font-extrabold text-slate-800">Afişe ekle</p>
      <div className="flex max-h-[min(40vh,14rem)] flex-col gap-1 overflow-y-auto pr-0.5">
        {PIECE_PALETTE.map((p) => (
          <div
            key={p.type}
            draggable
            onDragStart={(e) => {
              const payload = JSON.stringify({ type: p.type });
              e.dataTransfer.setData(SCENE_DND_MIME, payload);
              e.dataTransfer.setData("text/plain", payload);
              e.dataTransfer.effectAllowed = "copy";
            }}
            className="flex cursor-grab items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-800 active:cursor-grabbing"
          >
            {pieceIcon(p.type)}
            {p.label}
            <GripVertical className="ml-auto h-3.5 w-3.5 text-slate-400" />
          </div>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="w-full text-[9px] font-bold"
        onClick={() =>
          onSceneChange((sc) => ({
            ...initialPosterScene(),
            editMode: true,
            canvasBackground: sc.canvasBackground,
          }))
        }
      >
        Boş afişle başla
      </Button>
      <Button
        type="button"
        size="sm"
        className="w-full text-[9px] font-bold"
        onClick={() => {
          const built = buildSceneFromFormData(data);
          onSceneChange((sc) => ({
            ...sc,
            elements: built.elements,
            zCounter: built.zCounter,
            selectedId: null,
          }));
        }}
      >
        Otomatik afişten başla
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full text-[9px] font-bold"
        onClick={() => onSceneChange((sc) => ({ ...sc, elements: autoFixSceneLayout(sc.elements) }))}
      >
        Yerleşimi düzelt
      </Button>
      {propsPanel}
    </aside>
  ) : null;

  const stage = (
    <div ref={stageRef} className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg" {...canvasDropHandlers}>
      <div className="pointer-events-none absolute inset-0 z-0" style={canvasBgStyle(scene)} />
      {showChrome ? (
        <div
          className="absolute inset-0 z-[1]"
          {...canvasDropHandlers}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) onSceneChange((sc) => ({ ...sc, selectedId: null }));
          }}
        />
      ) : null}
      {sortedEls.map((el) => {
        const isSel = scene.selectedId === el.id && showChrome;
        return (
          <div
            key={el.id}
            className={cn(
              "absolute box-border overflow-hidden rounded-lg",
              isSel && "ring-2 ring-indigo-400 ring-offset-1 ring-offset-transparent",
            )}
            {...canvasDropHandlers}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.width}%`,
              height: `${el.height}%`,
              zIndex: SCENE_ELEMENT_Z_BASE + el.zIndex,
              transform: `rotate(${el.rotation}deg)`,
              transformOrigin: "center center",
            }}
            onPointerDown={(e) => {
              if (exportMode || el.locked) return;
              if ((e.target as HTMLElement).closest("[data-scene-handle]")) return;
              e.stopPropagation();
              onSceneChange((sc) => ({ ...sc, selectedId: el.id }));
              if (!showChrome) return;
              setDrag({ id: el.id, cx: e.clientX, cy: e.clientY, ex: el.x, ey: el.y });
            }}
          >
            <PlacedContent el={el} data={data} />
            {isSel ? (
              <>
                {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                  <div
                    key={corner}
                    data-scene-handle
                    className="absolute z-30 h-2.5 w-2.5 rounded-sm border border-indigo-600 bg-white shadow"
                    style={{
                      ...(corner.includes("n") ? { top: -4 } : { bottom: -4 }),
                      ...(corner.includes("w") ? { left: -4 } : { right: -4 }),
                      cursor: `${corner}-resize`,
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setResize({
                        id: el.id,
                        corner,
                        cx: e.clientX,
                        cy: e.clientY,
                        ex: el.x,
                        ey: el.y,
                        ew: el.width,
                        eh: el.height,
                      });
                    }}
                  />
                ))}
                <div
                  data-scene-handle
                  className="absolute -top-5 left-1/2 z-30 flex h-4 w-4 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-indigo-600 bg-white shadow active:cursor-grabbing"
                  title="Döndür"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const r = stageRef.current?.getBoundingClientRect();
                    if (!r) return;
                    const elcx = r.left + (el.x + el.width / 2) * (r.width / 100);
                    const elcy = r.top + (el.y + el.height / 2) * (r.height / 100);
                    setRotate({ id: el.id, cx: e.clientX, cy: e.clientY, base: el.rotation, elcx, elcy });
                  }}
                >
                  <RotateCw className="h-2.5 w-2.5 text-indigo-700" />
                </div>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-row items-stretch gap-3">
      {palette}
      {stage}
    </div>
  );
}
