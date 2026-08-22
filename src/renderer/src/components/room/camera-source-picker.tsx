"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Monitor,
  Film,
  Link,
  Check,
  ChevronDown,
  Loader2,
  AlertCircle,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CameraSourceType = "device" | "external-url" | "screen";

export interface CameraConfig {
  /** Camera device ID (from enumerateDevices). Omit to use default. */
  deviceId?: string;
  /** Microphone device ID. Omit to use default. */
  micDeviceId?: string;
  /** Pre-built video stream (for external URL / canvas capture). */
  externalStream?: MediaStream | null;
  /** Which source type was chosen */
  sourceType: CameraSourceType;
}

interface CameraSourcePickerProps {
  onConfirm: (config: CameraConfig) => void;
  onBack: () => void;
}

interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: "videoinput" | "audioinput";
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Build a preview stream for the given deviceId / constraints */
async function buildPreviewStream(
  deviceId?: string,
  micDeviceId?: string,
): Promise<MediaStream | null> {
  try {
    const videoConstraint: MediaTrackConstraints | boolean = deviceId
      ? { deviceId: { exact: deviceId } }
      : true;
    const audioConstraint: MediaTrackConstraints | boolean = micDeviceId
      ? { deviceId: { exact: micDeviceId } }
      : true;
    return await navigator.mediaDevices.getUserMedia({
      video: videoConstraint,
      audio: audioConstraint,
    });
  } catch {
    return null;
  }
}

/** Capture a video element's stream via captureStream / mozCaptureStream */
function captureVideoStream(videoEl: HTMLVideoElement, fps = 30): MediaStream | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = videoEl as any;
  if (typeof el.captureStream === "function") return el.captureStream(fps);
  if (typeof el.mozCaptureStream === "function") return el.mozCaptureStream(fps);
  return null;
}

// ─── component ────────────────────────────────────────────────────────────────

export function CameraSourcePicker({ onConfirm, onBack }: CameraSourcePickerProps) {
  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [mics, setMics] = useState<DeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | "external" | "screen">("default");
  const [selectedMic, setSelectedMic] = useState<string>("default");
  const [sourceType, setSourceType] = useState<CameraSourceType>("device");

  const [externalUrl, setExternalUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [externalCapturedStream, setExternalCapturedStream] = useState<MediaStream | null>(null);

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showMicDropdown, setShowMicDropdown] = useState(false);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const externalVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  // ── enumerate devices ───────────────────────────────────────────────────────
  useEffect(() => {
    async function enumerate() {
      try {
        // Need at least a temporary permission grant to get labels
        const tempStream = await navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .catch(() => null);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDev = devices.filter(
          (d): d is MediaDeviceInfo & { kind: "videoinput" } => d.kind === "videoinput",
        );
        const audioDev = devices.filter(
          (d): d is MediaDeviceInfo & { kind: "audioinput" } => d.kind === "audioinput",
        );

        setCameras(
          videoDev.map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${i + 1}`,
            kind: "videoinput",
          })),
        );
        setMics(
          audioDev.map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${i + 1}`,
            kind: "audioinput",
          })),
        );

        // Stop the temp stream — we only needed labels
        tempStream?.getTracks().forEach((t) => t.stop());
      } catch {
        setPermissionDenied(true);
      }
    }
    enumerate();
  }, []);

  // ── build camera preview ────────────────────────────────────────────────────
  const refreshPreview = useCallback(async () => {
    // Stop any existing preview stream
    previewStreamRef.current?.getTracks().forEach((t) => t.stop());
    previewStreamRef.current = null;
    setPreviewStream(null);

    if (sourceType !== "device") return;

    const deviceId = selectedCamera === "default" ? undefined : selectedCamera;
    const micId = selectedMic === "default" ? undefined : selectedMic;

    const stream = await buildPreviewStream(deviceId, micId);
    if (stream) {
      previewStreamRef.current = stream;
      setPreviewStream(stream);
    } else {
      setPermissionDenied(true);
    }
  }, [selectedCamera, selectedMic, sourceType]);

  useEffect(() => {
    refreshPreview();
    return () => {
      previewStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCamera, selectedMic, sourceType]);

  // ── attach preview to video element ────────────────────────────────────────
  useEffect(() => {
    if (previewVideoRef.current && previewStream) {
      previewVideoRef.current.srcObject = previewStream;
    } else if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
  }, [previewStream]);

  // ── external URL loader ─────────────────────────────────────────────────────
  const handleLoadExternalUrl = async () => {
    if (!externalUrl.trim()) {
      setUrlError("Please enter a URL");
      return;
    }
    setUrlError("");
    setIsLoadingUrl(true);

    // Clean up previous
    externalVideoRef.current?.pause();
    externalCapturedStream?.getTracks().forEach((t) => t.stop());
    setExternalCapturedStream(null);

    const videoEl = document.createElement("video");
    videoEl.src = externalUrl;
    videoEl.loop = true;
    videoEl.muted = true;
    videoEl.crossOrigin = "anonymous";
    videoEl.style.display = "none";
    document.body.appendChild(videoEl);
    externalVideoRef.current = videoEl;

    try {
      await videoEl.play();
      const stream = captureVideoStream(videoEl, 30);
      if (!stream || stream.getVideoTracks().length === 0) {
        throw new Error("captureStream not supported");
      }
      setExternalCapturedStream(stream);
      // Show preview
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
      setIsLoadingUrl(false);
    } catch (err) {
      document.body.removeChild(videoEl);
      externalVideoRef.current = null;
      setUrlError(
        "Could not load video. Check the URL and that CORS is allowed, or try a direct MP4 link.",
      );
      setIsLoadingUrl(false);
    }
  };

  // ── cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      previewStreamRef.current?.getTracks().forEach((t) => t.stop());
      externalCapturedStream?.getTracks().forEach((t) => t.stop());
      if (externalVideoRef.current) {
        externalVideoRef.current.pause();
        if (document.body.contains(externalVideoRef.current)) {
          document.body.removeChild(externalVideoRef.current);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── confirm selection ───────────────────────────────────────────────────────
  const handleConfirm = () => {
    // Stop preview before handing off — the room hook will start the real stream
    previewStreamRef.current?.getTracks().forEach((t) => t.stop());

    if (sourceType === "external-url") {
      // Pass the captured canvas/video stream as-is — room hook merges mic separately
      onConfirm({
        sourceType: "external-url",
        externalStream: externalCapturedStream,
        micDeviceId: selectedMic === "default" ? undefined : selectedMic,
      });
    } else if (sourceType === "screen") {
      // Screen capture is handled by useWebRTC's toggleScreenShare flow.
      // We pass a flag; the hook knows to call getDisplayMedia on mount.
      onConfirm({
        sourceType: "screen",
        micDeviceId: selectedMic === "default" ? undefined : selectedMic,
      });
    } else {
      onConfirm({
        sourceType: "device",
        deviceId: selectedCamera === "default" ? undefined : selectedCamera,
        micDeviceId: selectedMic === "default" ? undefined : selectedMic,
      });
    }
  };

  // ── UI ──────────────────────────────────────────────────────────────────────
  const sourceOptions: {
    id: CameraSourceType | "external-url";
    label: string;
    icon: React.ReactNode;
    desc: string;
  }[] = [
    {
      id: "device",
      label: "Camera",
      icon: <Camera className="w-4 h-4" />,
      desc: "Use your webcam or capture card",
    },
    {
      id: "external-url",
      label: "External Video",
      icon: <Film className="w-4 h-4" />,
      desc: "Stream a video URL as your camera",
    },
    {
      id: "screen",
      label: "Screen / Window",
      icon: <Monitor className="w-4 h-4" />,
      desc: "Share your screen as the camera feed",
    },
  ];

  const isConfirmReady =
    sourceType === "device"
      ? !permissionDenied
      : sourceType === "external-url"
        ? !!externalCapturedStream
        : true; // screen

  return (
    <motion.div
      className="w-full flex flex-col gap-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col sm:flex-row gap-5 w-full">
        {/* ── Left: source list + mic ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:w-52 shrink-0">
          {/* Source type tabs */}
          <p className="text-[11px] uppercase tracking-widest text-white/30 font-medium">
            Camera Source
          </p>
          <div className="flex flex-col gap-1.5">
            {sourceOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setSourceType(opt.id as CameraSourceType);
                  setUrlError("");
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-200",
                  sourceType === opt.id
                    ? "bg-white/10 border-white/20 text-white"
                    : "border-white/5 text-white/40 hover:text-white/70 hover:bg-white/5",
                )}
              >
                <span
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    sourceType === opt.id ? "bg-indigo-500/30 text-indigo-300" : "bg-white/5",
                  )}
                >
                  {opt.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{opt.label}</p>
                  <p className="text-[10px] text-white/30 truncate">{opt.desc}</p>
                </div>
                {sourceType === opt.id && (
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Camera device dropdown (only for "device" mode) */}
          <AnimatePresence>
            {sourceType === "device" && cameras.length > 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="text-[11px] uppercase tracking-widest text-white/30 font-medium mb-2 mt-1">
                  Select Camera
                </p>
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                  {/* Default / system default */}
                  <button
                    onClick={() => setSelectedCamera("default")}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs text-left transition-all",
                      selectedCamera === "default"
                        ? "bg-white/10 border-white/20 text-white"
                        : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/5",
                    )}
                  >
                    <Video className="w-3 h-3 shrink-0" />
                    <span className="truncate">System Default</span>
                  </button>
                  {cameras.map((cam) => (
                    <button
                      key={cam.deviceId}
                      onClick={() => setSelectedCamera(cam.deviceId)}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs text-left transition-all",
                        selectedCamera === cam.deviceId
                          ? "bg-white/10 border-white/20 text-white"
                          : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/5",
                      )}
                    >
                      <Camera className="w-3 h-3 shrink-0" />
                      <span className="truncate">{cam.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Microphone section */}
          <div className="mt-1">
            <p className="text-[11px] uppercase tracking-widest text-white/30 font-medium mb-2">
              Microphone
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMicOn((v) => !v)}
                className={cn(
                  "p-2 rounded-lg border transition-all shrink-0",
                  isMicOn
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/20 border-red-500/30 text-red-400",
                )}
              >
                {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              </button>
              {mics.length > 1 && (
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowMicDropdown((v) => !v)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-white/60 hover:text-white/80 transition-all"
                  >
                    <span className="flex-1 truncate text-left">
                      {selectedMic === "default"
                        ? "Default mic"
                        : mics.find((m) => m.deviceId === selectedMic)?.label || "Microphone"}
                    </span>
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  </button>
                  <AnimatePresence>
                    {showMicDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute bottom-full mb-1 left-0 right-0 z-50 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                      >
                        {[{ deviceId: "default", label: "Default" }, ...mics].map((m) => (
                          <button
                            key={m.deviceId}
                            onClick={() => {
                              setSelectedMic(m.deviceId);
                              setShowMicDropdown(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/5",
                              selectedMic === m.deviceId ? "text-white" : "text-white/50",
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: preview pane ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-3">
          <p className="text-[11px] uppercase tracking-widest text-white/30 font-medium">Preview</p>
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center">
            {permissionDenied && sourceType === "device" ? (
              <div className="flex flex-col items-center gap-2 text-center px-6">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-white/60">
                  Camera permission denied.
                  <br />
                  <span className="text-white/40 text-xs">
                    Click the camera icon in your browser bar to allow access.
                  </span>
                </p>
              </div>
            ) : sourceType === "device" && !previewStream ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                <p className="text-xs text-white/30">Connecting camera…</p>
              </div>
            ) : sourceType === "screen" ? (
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <Monitor className="w-10 h-10 text-indigo-400/60" />
                <p className="text-sm text-white/50">
                  You&apos;ll be asked to pick a window or screen
                  <br />
                  <span className="text-xs text-white/30">right after joining the room</span>
                </p>
              </div>
            ) : null}

            {/* Live camera preview */}
            <video
              ref={previewVideoRef}
              autoPlay
              muted
              playsInline
              className={cn(
                "w-full h-full object-cover",
                sourceType === "device" && previewStream
                  ? "block"
                  : sourceType === "external-url" && externalCapturedStream
                    ? "block"
                    : "hidden",
              )}
            />

            {/* Camera-off overlay for device mode */}
            {!isMicOn && sourceType === "device" && previewStream && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 text-white/70 rounded-full px-2 py-1 text-[10px]">
                <MicOff className="w-3 h-3 text-red-400" />
                Mic muted
              </div>
            )}
          </div>

          {/* External URL input */}
          <AnimatePresence>
            {sourceType === "external-url" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      value={externalUrl}
                      onChange={(e) => {
                        setExternalUrl(e.target.value);
                        setUrlError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleLoadExternalUrl()}
                      placeholder="https://example.com/video.mp4"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleLoadExternalUrl}
                    disabled={isLoadingUrl}
                    className="px-3 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm hover:bg-indigo-500/30 transition-all disabled:opacity-50"
                  >
                    {isLoadingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load"}
                  </button>
                </div>
                {urlError && (
                  <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {urlError}
                  </p>
                )}
                {externalCapturedStream && (
                  <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Video loaded — this will be your camera feed
                  </p>
                )}
                <p className="text-[10px] text-white/20 mt-2">
                  Enter a direct MP4/WebM URL. The video will loop as your camera feed. CORS must be
                  allowed on the source server.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Action buttons ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <button
          onClick={onBack}
          className="text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isConfirmReady}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
            isConfirmReady
              ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/30 hover:border-indigo-400/50"
              : "opacity-40 cursor-not-allowed border border-white/10 text-white/40",
          )}
        >
          {sourceType === "screen" ? (
            <>
              <Monitor className="w-4 h-4" />
              Join &amp; Share Screen
            </>
          ) : sourceType === "external-url" && !externalCapturedStream ? (
            <>
              <Film className="w-4 h-4" />
              Load a video first
            </>
          ) : (
            <>
              <CameraOff className={cn("w-4 h-4", isConfirmReady && "hidden")} />
              <Camera className={cn("w-4 h-4", !isConfirmReady && "hidden")} />
              Join Room
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
