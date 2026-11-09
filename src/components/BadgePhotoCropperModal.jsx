import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scissors,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Upload,
  Check,
  X,
  RefreshCw,
  Move,
  Sparkles,
  Camera
} from 'lucide-react';
import ModalPortal from './ModalPortal';

/**
 * 4:5 Portrait Ratio Image Cropper for JRE 2027 ID Badges
 * Aspect Ratio: 4:5 (Standard ID card photo: 132 x 162 px / 600 x 750 px HD output)
 */
export default function BadgePhotoCropperModal({
  isOpen,
  person,
  onClose,
  onSave
}) {
  const reg = person?.reg || person;
  const initialPhoto = reg?.id_card_photo || reg?.user_avatar || reg?.avatar || '';

  const [imageSrc, setImageSrc] = useState(initialPhoto);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Sync initial photo when person changes
  useEffect(() => {
    if (isOpen) {
      const src = reg?.id_card_photo || reg?.user_avatar || reg?.avatar || '';
      setImageSrc(src);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, reg]);

  // Load image dimensions
  const onImageLoad = (e) => {
    const img = e.currentTarget;
    setNaturalDimensions({
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height
    });
  };

  // Mouse / Touch drag to pan
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Wheel to zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(3.5, Math.max(0.6, prev + delta)));
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset positioning
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Select local file from device
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageSrc(reader.result);
        setZoom(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Export cropped 4:5 image to Canvas (600 x 750 px)
  const handleSaveCrop = async () => {
    if (!imageSrc) return;
    setIsSaving(true);

    try {
      const OUTPUT_W = 600;
      const OUTPUT_H = 750;
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_W;
      canvas.height = OUTPUT_H;
      const ctx = canvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Load image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      // Frame dimensions on screen: 264 x 330 px (4:5 ratio)
      const frameW = 264;
      const frameH = 330;
      const scaleMultiplier = OUTPUT_W / frameW; // approx 2.27x

      ctx.save();
      // Translate to canvas center
      ctx.translate(OUTPUT_W / 2, OUTPUT_H / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Scale applied
      const totalZoom = zoom * scaleMultiplier;

      // Draw image centered with offset
      // When rotated 90 or 270, adjust offsets
      const rad = (-rotation * Math.PI) / 180;
      const unrotatedOffsetX = (offset.x * Math.cos(rad) - offset.y * Math.sin(rad)) * scaleMultiplier;
      const unrotatedOffsetY = (offset.x * Math.sin(rad) + offset.y * Math.cos(rad)) * scaleMultiplier;

      // Base cover dimensions
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const frameRatio = frameW / frameH;
      let baseW, baseH;
      if (imgRatio > frameRatio) {
        baseH = frameH;
        baseW = frameH * imgRatio;
      } else {
        baseW = frameW;
        baseH = frameW / imgRatio;
      }

      const drawW = baseW * totalZoom;
      const drawH = baseH * totalZoom;

      ctx.drawImage(
        img,
        -drawW / 2 + unrotatedOffsetX,
        -drawH / 2 + unrotatedOffsetY,
        drawW,
        drawH
      );
      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      await onSave(croppedDataUrl);
      onClose();
    } catch (err) {
      console.error('Cropping error:', err);
      alert('เกิดข้อผิดพลาดในการตัดรูปภาพ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !reg) return null;

  const displayName = reg.first_name 
    ? `${reg.prefix || ''} ${reg.first_name} ${reg.last_name || ''}`.trim()
    : reg.thai_name || reg.name || 'ผู้สมัคร';

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-500/40 bg-orange-500/10 text-orange-400">
                <Scissors className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white sm:text-lg">
                  ครอปรูปประจำตัวสำหรับบัตร (CR100)
                </h3>
                <p className="text-xs text-slate-400">
                  {displayName} • สัดส่วนมาตรฐาน 4:5 สำหรับบัตรคล้องคอ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cropper Viewport */}
          <div className="p-6 flex flex-col items-center justify-center bg-[#071324] select-none">
            {/* Viewfinder Frame (264 x 330 px -> 4:5 ratio) */}
            <div
              ref={containerRef}
              onWheel={handleWheel}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
              className="relative w-[264px] h-[330px] rounded-2xl overflow-hidden border-2 border-orange-400 shadow-2xl shadow-orange-500/10 bg-slate-950 cursor-grab active:cursor-grabbing group"
              title="คลิกลากเพื่อเลื่อนตำแหน่งภาพ หรือหมุนลูกกลิ้งเมาส์เพื่อซูม"
            >
              {/* Image with Transformations */}
              {imageSrc ? (
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  draggable={false}
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.08s ease-out'
                  }}
                  className="pointer-events-none h-full w-full object-cover select-none"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-slate-500">
                  <Camera className="h-10 w-10 mb-2 opacity-50" />
                  <span className="text-xs">ยังไม่มีรูปถ่าย</span>
                </div>
              )}

              {/* Viewfinder Grid Overlay (Rule of Thirds) */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/20 opacity-40">
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-white/30" />
                <div className="border-r border-white/30" />
                <div />
              </div>

              {/* Tag Overlays */}
              <div className="pointer-events-none absolute top-2 left-2 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-300 border border-orange-500/30">
                4:5 Ratio
              </div>
              <div className="pointer-events-none absolute bottom-2 inset-x-2 rounded-md bg-slate-950/80 py-1 text-center text-[10px] font-bold text-slate-300">
                คลิกลากเพื่อจัดกึ่งกลางใบหน้า
              </div>
            </div>

            {/* Hint */}
            <p className="mt-3 text-center text-[11px] text-slate-400">
              💡 แนะนำให้จัดใบหน้าให้อยู่ตรงกลางช่อง และเผื่อพื้นที่ช่วงไหล่เล็กน้อย
            </p>
          </div>

          {/* Toolbar Controls */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-4">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                title="ย่อขนาด"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">ซูม:</span>
                <input
                  type="range"
                  min="0.6"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-orange-400 w-12 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.0, z + 0.1))}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                title="ขยายขนาด"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-bold text-slate-200 hover:border-orange-400/50 hover:text-white transition-colors cursor-pointer"
                  title="หมุน 90 องศาตามเข็มนาฬิกา"
                >
                  <RotateCw className="h-3.5 w-3.5 text-orange-400" />
                  <span>หมุน 90° ({rotation}°)</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="รีเซ็ตตำแหน่งและซูม"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>รีเซ็ต</span>
                </button>
              </div>

              {/* Upload New Image from Device */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-200 hover:bg-sky-500/20 transition-colors cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>เปลี่ยนรูปใหม่</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-5 py-4 bg-slate-950/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={isSaving || !imageSrc}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>กำลังบันทึกรูป...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>✂️ ตัดรูปและบันทึกใส่บัตร</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
