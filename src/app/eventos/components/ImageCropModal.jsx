import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function ImageCropModal({
  open,
  file,
  onClose,
  onConfirm,
  title = "Ajustar imagem",
  outputSize = 512,
}) {
  const containerSize = 260;

  const [imgUrl, setImgUrl] = useState(null);
  const [imgObj, setImgObj] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    if (!file || !open) {
      setImgUrl(null);
      setImgObj(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const url = URL.createObjectURL(file);
    setImgUrl(url);

    const img = new Image();
    img.onload = () => {
      setImgObj(img);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, open]);

  const baseScale = useMemo(() => {
    if (!imgObj) {
      return 1;
    }
    const scaleToCover = Math.max(
      containerSize / imgObj.naturalWidth,
      containerSize / imgObj.naturalHeight,
    );
    return scaleToCover;
  }, [imgObj]);

  const totalScale = baseScale * zoom;

  const imgLayout = useMemo(() => {
    if (!imgObj) {
      return null;
    }

    const drawW = imgObj.naturalWidth * totalScale;
    const drawH = imgObj.naturalHeight * totalScale;

    const left = (containerSize - drawW) / 2 + pan.x;
    const top = (containerSize - drawH) / 2 + pan.y;

    return { drawW, drawH, left, top };
  }, [containerSize, imgObj, pan.x, pan.y, totalScale]);

  const onMouseDown = useCallback(
    (e) => {
      draggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan.x, pan.y],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const onMove = (e) => {
      if (!draggingRef.current) {
        return;
      }
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    };

    const onUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [open]);

  const buildCroppedBase64 = useCallback(() => {
    if (!imgObj || !imgLayout) {
      return null;
    }

    // Determine which part of the source image is visible inside the crop square.
    // Container coordinates: (0..containerSize)
    const sx = (0 - imgLayout.left) / totalScale;
    const sy = (0 - imgLayout.top) / totalScale;
    const sWidth = containerSize / totalScale;
    const sHeight = containerSize / totalScale;

    const safeSx = clamp(sx, 0, imgObj.naturalWidth);
    const safeSy = clamp(sy, 0, imgObj.naturalHeight);

    const safeSW = clamp(sWidth, 0, imgObj.naturalWidth - safeSx);
    const safeSH = clamp(sHeight, 0, imgObj.naturalHeight - safeSy);

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.drawImage(
      imgObj,
      safeSx,
      safeSy,
      safeSW,
      safeSH,
      0,
      0,
      outputSize,
      outputSize,
    );

    return canvas.toDataURL("image/jpeg", 0.92);
  }, [containerSize, imgLayout, imgObj, outputSize, totalScale]);

  const handleConfirm = useCallback(() => {
    const base64 = buildCroppedBase64();
    if (!base64) {
      onConfirm(null);
      return;
    }
    onConfirm(base64);
  }, [buildCroppedBase64, onConfirm]);

  if (!open) {
    return null;
  }

  const previewTransform = imgLayout
    ? `translate(${imgLayout.left}px, ${imgLayout.top}px) scale(1)`
    : "translate(0px, 0px)";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 top-[8%] mx-auto w-[min(520px,calc(100vw-24px))] bg-white rounded-2xl border border-[#E6E6E6] shadow-xl p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold font-inter text-[#111827] truncate">
              {title}
            </div>
            <div className="text-xs text-[#6B7280] font-inter mt-1">
              Arraste para enquadrar, use o zoom, e confirme.
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-full border border-[#E6E6E6] text-sm font-inter text-[#111827] hover:bg-[#F9FAFB]"
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <div
            className="relative rounded-xl border border-[#E6E6E6] bg-[#F3F4F6] overflow-hidden"
            style={{ width: containerSize, height: containerSize }}
          >
            {imgUrl ? (
              <div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                onMouseDown={onMouseDown}
              >
                {imgLayout ? (
                  <img
                    src={imgUrl}
                    alt="Prévia"
                    draggable={false}
                    style={{
                      position: "absolute",
                      width: imgLayout.drawW,
                      height: imgLayout.drawH,
                      transform: previewTransform,
                      userSelect: "none",
                    }}
                  />
                ) : null}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-inter text-[#6B7280]">
                Selecione uma imagem
              </div>
            )}

            {/* Crop frame */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-black/10" />
          </div>

          <div className="flex-1">
            <div className="text-sm font-semibold font-inter text-[#111827] mb-2">
              Zoom
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleConfirm}
                className="inline-flex items-center h-10 px-5 rounded-full bg-gradient-to-b from-[#252525] to-[#0F0F0F] text-white text-sm font-semibold transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] active:scale-95"
              >
                Usar imagem
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center h-10 px-5 rounded-full border border-[#E6E6E6] text-[#111827] text-sm font-semibold hover:bg-[#F9FAFB]"
              >
                Cancelar
              </button>
            </div>

            <div className="mt-4 text-xs text-[#6B7280] font-inter">
              Dica: essa ferramenta já resolve o “corte estilo Instagram” para
              caber no formato do logo.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
