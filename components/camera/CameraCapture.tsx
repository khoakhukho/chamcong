'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, MapPin, Clock, User, ShieldCheck, X } from 'lucide-react';
import { Coordinates, LocationTarget, checkGeofence, getAddressFromCoordinates } from '@/lib/geofencing';

interface CameraCaptureProps {
  user: {
    id: number;
    employeeCode: string;
    fullName: string;
    department?: string | null;
  };
  locations: LocationTarget[];
  onCaptureComplete: (data: {
    imageData: string;
    latitude: number | null;
    longitude: number | null;
    locationAddress: string;
    isValidLocation: boolean;
    distanceMeters: number;
    nearestLocationName: string | null;
  }) => void;
  onCancel?: () => void;
}

export default function CameraCapture({
  user,
  locations,
  onCaptureComplete,
  onCancel,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // GPS & Location State
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string>('Đang lấy vị trí GPS...');
  const [geoResult, setGeoResult] = useState<{
    isValid: boolean;
    distanceMeters: number;
    nearestLocation: LocationTarget | null;
    message: string;
  } | null>(null);

  // Captured State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Start Camera
  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front Camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      let msg = 'Không thể mở Camera. Vui lòng cho phép quyền truy cập Camera trên trình duyệt.';
      if (err.name === 'NotAllowedError') {
        msg = 'Quyền truy cập Camera bị từ chối. Vui lòng nhấn vào biểu tượng ổ khóa cạnh thanh địa chỉ để cấp quyền.';
      } else if (err.name === 'NotFoundError') {
        msg = 'Không tìm thấy thiết bị Camera trên máy.';
      }
      setCameraError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [stream]);

  // Request Geolocation
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setAddress('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userCoord = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setCoords(userCoord);

        // Check Geofence with configured locations
        const check = checkGeofence(userCoord, locations);
        setGeoResult(check);

        // Reverse geocoding
        const addr = await getAddressFromCoordinates(userCoord);
        setAddress(addr);
      },
      (err) => {
        console.warn('GPS error:', err);
        setAddress('Không lấy được GPS (Vui lòng bật định vị)');
        setGeoResult({
          isValid: false,
          distanceMeters: 0,
          nearestLocation: null,
          message: 'Không có dữ liệu GPS chính xác',
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [locations]);

  useEffect(() => {
    startCamera();
    requestLocation();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Take Snapshot & Render Watermark onto HTML5 Canvas
  const takeSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      canvas.width = width;
      canvas.height = height;

      // 1. Draw Video Frame (Mirror horizontally if user facing)
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();

      // 2. Fetch Server Time (Fall back to current date if offline)
      let timeString = '';
      try {
        const timeRes = await fetch('/api/server-time');
        if (timeRes.ok) {
          const timeData = await timeRes.json();
          timeString = timeData.formattedTime;
        }
      } catch {
        // fallback
      }
      if (!timeString) {
        timeString = new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date());
      }

      // 3. Draw Watermark Overlay Banner at Bottom
      const bannerHeight = Math.max(140, height * 0.26);
      const startY = height - bannerHeight;

      // Gradient background
      const gradient = ctx.createLinearGradient(0, startY, 0, height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.0)');
      gradient.addColorStop(0.2, 'rgba(15, 23, 42, 0.85)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, startY, width, bannerHeight);

      // Top Red Accent Line
      ctx.fillStyle = '#DC2626'; // Caritas Red
      ctx.fillRect(0, startY + 15, width, 3);

      // 4. Draw Watermark Typography
      const paddingX = 20;
      let textY = startY + 40;

      // Header: Caritas Dalat
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#F87171'; // Red-400
      ctx.fillText('CARITAS ĐÀ LẠT • HỆ THỐNG CHẤM CÔNG', paddingX, textY);

      // Name & Employee Code
      textY += 22;
      ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${user.fullName} (${user.employeeCode})`, paddingX, textY);

      // Server Time (GMT+7)
      textY += 20;
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#38BDF8'; // Sky-400
      ctx.fillText(`🕒 ${timeString} (GMT+7)`, paddingX, textY);

      // GPS Coordinates & Location
      textY += 18;
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#CBD5E1'; // Slate-300
      const coordStr = coords
        ? `📍 ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
        : '📍 Không có GPS';
      ctx.fillText(coordStr, paddingX, textY);

      // Address & Nearest Location badge
      textY += 18;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = geoResult?.isValid ? '#4ADE80' : '#FBBF24'; // Green / Amber
      const locStatus = geoResult
        ? `[${geoResult.isValid ? '✓ ĐÚNG ĐỊA ĐIỂM' : '⚠ NGOÀI VÙNG'}] ${geoResult.nearestLocation?.name || ''} (${geoResult.distanceMeters}m)`
        : '[ĐANG XÁC THỰC VỊ TRÍ]';
      ctx.fillText(locStatus, paddingX, textY);

      // Convert to WebP / JPEG Data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedImage(dataUrl);

      // Stop camera stream preview once captured
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.error('Snapshot error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
    requestLocation();
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    onCaptureComplete({
      imageData: capturedImage,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      locationAddress: address,
      isValidLocation: geoResult?.isValid ?? true,
      distanceMeters: geoResult?.distanceMeters ?? 0,
      nearestLocationName: geoResult?.nearestLocation?.name ?? null,
    });
  };

  return (
    <div className="relative flex flex-col items-center w-full max-w-md mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 text-white">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 z-10">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-slate-200">
            Chụp Ảnh Xác Thực Chấm Công
          </span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Viewport (Video Live Stream or Captured Preview) */}
      <div className="relative w-full aspect-[3/4] bg-black flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="p-6 text-center text-slate-300">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-medium mb-4">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow inline-flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured Preview with Watermark"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Live Camera Guide Frame Overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-white/30 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
              <div className="text-center text-xs font-medium text-white/70 bg-black/40 px-3 py-1 rounded-full mx-auto backdrop-blur-sm">
                Vui lòng căn chỉnh khuôn mặt vào giữa khung hình
              </div>
              <div className="text-center text-[11px] text-white/80 bg-black/60 px-3 py-1.5 rounded-lg mx-auto backdrop-blur-sm flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span className="truncate max-w-[240px]">{address}</span>
              </div>
            </div>
          </>
        )}

        {/* Hidden Canvas used for watermark processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Status & Live Info */}
      <div className="w-full px-4 py-3 bg-slate-950 border-t border-slate-800 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <strong className="text-slate-200">{user.fullName}</strong>
          </span>
          <span className="text-slate-400 font-mono">[{user.employeeCode}]</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[200px]">
              {geoResult?.nearestLocation?.name || address}
            </span>
          </div>
          {geoResult && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                geoResult.isValid
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {geoResult.isValid ? 'HỢP LỆ' : `NGOÀI VÙNG (${geoResult.distanceMeters}m)`}
            </span>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="w-full p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
        {capturedImage ? (
          <>
            <button
              onClick={handleRetake}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center justify-center space-x-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Chụp lại</span>
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/40 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận ảnh</span>
            </button>
          </>
        ) : (
          <button
            onClick={takeSnapshot}
            disabled={isInitializing || !!cameraError || isProcessing}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white text-base font-bold flex items-center justify-center space-x-2 shadow-lg shadow-red-950/50 transition active:scale-[0.99]"
          >
            <Camera className="w-5 h-5" />
            <span>{isProcessing ? 'Đang xử lý đóng dấu...' : 'CHỤP ẢNH & ĐÓNG DẤU'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
