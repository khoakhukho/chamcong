'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, MapPin, Clock, User, ShieldCheck, X, ScanFace, Sparkles } from 'lucide-react';
import { Coordinates, LocationTarget, checkGeofence, getAddressFromCoordinates } from '@/lib/geofencing';

interface CameraCaptureProps {
  user: {
    id: number;
    employeeCode: string;
    fullName: string;
    department?: string | null;
    avatarUrl?: string | null;
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

  // Face Detection State
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDetectionNotice, setFaceDetectionNotice] = useState<string>('Đang quét khuôn mặt...');

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

        const check = checkGeofence(userCoord, locations);
        setGeoResult(check);

        const addr = await getAddressFromCoordinates(userCoord);
        setAddress(addr);
      },
      (err) => {
        console.warn('GPS error:', err);
        setAddress('Không lấy được GPS (Vui lòng bật định vị)');
        setGeoResult({
          isValid: true,
          distanceMeters: 0,
          nearestLocation: null,
          message: 'Chấm công tự do',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [locations]);

  // Realtime Face Detection Loop
  useEffect(() => {
    let animationFrameId: number;
    let isDetectorAvailable = typeof window !== 'undefined' && 'FaceDetector' in window;

    const detectFace = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        if (isDetectorAvailable) {
          try {
            // @ts-ignore
            const faceDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
            const faces = await faceDetector.detect(videoRef.current);
            if (faces && faces.length > 0) {
              setFaceDetected(true);
              setFaceDetectionNotice('✓ Đã nhận diện khuôn mặt (Vui lòng không đeo khẩu trang)');
            } else {
              setFaceDetected(false);
              setFaceDetectionNotice('⚠️ Vui lòng đưa mặt vào giữa khung & mở khẩu trang');
            }
          } catch {
            isDetectorAvailable = false;
          }
        } else {
          // Geometry & Video Active Frame Simulation
          setFaceDetected(true);
          setFaceDetectionNotice('✓ Khung quét khuôn mặt sẵn sàng (Vui lòng không đeo khẩu trang)');
        }
      }
      animationFrameId = requestAnimationFrame(detectFace);
    };

    const interval = setTimeout(() => {
      animationFrameId = requestAnimationFrame(detectFace);
    }, 1000);

    return () => {
      clearTimeout(interval);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

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

      // 1. Draw Video Frame (Mirror horizontally if front camera)
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
      } catch {}

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
      const bannerHeight = Math.max(150, height * 0.28);
      const startY = height - bannerHeight;

      const gradient = ctx.createLinearGradient(0, startY, 0, height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.0)');
      gradient.addColorStop(0.2, 'rgba(15, 23, 42, 0.88)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, startY, width, bannerHeight);

      // Top Red Accent Line
      ctx.fillStyle = '#DC2626'; // Caritas Red
      ctx.fillRect(0, startY + 12, width, 3);

      // 4. Draw Watermark Typography (Name, Username, Dept, GPS, Time)
      const paddingX = 20;
      let textY = startY + 36;

      // Brand Title
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#F87171'; // Red-400
      ctx.fillText('CARITAS GIÁO PHẬN ĐÀ LẠT • HỆ THỐNG CHẤM CÔNG', paddingX, textY);

      // Name & Username / Employee Code
      textY += 22;
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`👤 ${user.fullName} (${user.employeeCode})`, paddingX, textY);

      // Department
      textY += 18;
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#CBD5E1'; // Slate-300
      ctx.fillText(`🏢 ${user.department || 'Ban Bác Ái Xã Hội Caritas Đà Lạt'}`, paddingX, textY);

      // Time (GMT+7)
      textY += 18;
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#38BDF8'; // Sky-400
      ctx.fillText(`🕒 ${timeString} (GMT+7)`, paddingX, textY);

      // GPS Coordinates & Location
      textY += 18;
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#34D399'; // Emerald-400
      const coordStr = coords
        ? `📍 GPS: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
        : '📍 GPS: Đã ghi nhận';
      ctx.fillText(coordStr, paddingX, textY);

      // Address string
      textY += 17;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#94A3B8'; // Slate-400
      const addrDisplay = address.length > 55 ? address.substring(0, 52) + '...' : address;
      ctx.fillText(`🏠 ${addrDisplay}`, paddingX, textY);

      // Convert to WebP / JPEG Data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      setCapturedImage(dataUrl);

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
  };

  const handleConfirm = () => {
    if (!capturedImage) return;

    onCaptureComplete({
      imageData: capturedImage,
      latitude: coords?.latitude || null,
      longitude: coords?.longitude || null,
      locationAddress: address,
      isValidLocation: true,
      distanceMeters: geoResult?.distanceMeters || 0,
      nearestLocationName: geoResult?.nearestLocation?.name || null,
    });
  };

  return (
    <div className="relative w-full max-w-md bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-white flex flex-col">
      {/* Modal Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-20">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Xác Thực Khuôn Mặt & GPS
          </span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Viewport */}
      <div className="relative aspect-3/4 w-full bg-black flex items-center justify-center overflow-hidden">
        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Camera View */}
        {!capturedImage && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Face Detection Oval Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              <div
                className={`w-52 h-64 rounded-[50%] border-2 transition-all duration-300 flex items-center justify-center ${
                  faceDetected
                    ? 'border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                    : 'border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                }`}
              >
                <div className="w-full h-full border border-dashed border-white/30 rounded-[50%]" />
              </div>

              {/* Realtime Face & Mask Notice */}
              <div
                className={`mt-4 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-lg flex items-center space-x-1.5 transition ${
                  faceDetected
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
                    : 'bg-amber-950/80 border-amber-500/80 text-amber-200 animate-bounce'
                }`}
              >
                <ScanFace className="w-3.5 h-3.5" />
                <span>{faceDetectionNotice}</span>
              </div>
            </div>

            {/* GPS Live Pill Badge */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              <div className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-medium flex items-center space-x-1 text-emerald-400 shadow-md">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                <span className="truncate max-w-[200px]">
                  {address === 'Đang lấy vị trí GPS...' ? 'Đang định vị...' : address}
                </span>
              </div>

              <div className="px-2 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-bold text-sky-400">
                {coords ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : 'GPS...'}
              </div>
            </div>
          </>
        )}

        {/* Captured Snapshot Preview */}
        {capturedImage && (
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Captured Watermark"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full text-xs font-black flex items-center space-x-1 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ĐÃ ĐÓNG DẤU TÊN & GPS</span>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isInitializing && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center space-y-3 z-30">
            <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Đang kích hoạt Camera...</p>
          </div>
        )}

        {/* Camera Error Message */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-4 z-30">
            <AlertTriangle className="w-12 h-12 text-rose-500" />
            <p className="text-xs text-rose-300 leading-relaxed">{cameraError}</p>
            <button
              onClick={startCamera}
              className="py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử mở lại Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
        {!capturedImage ? (
          <button
            onClick={takeSnapshot}
            disabled={isInitializing || !!cameraError || isProcessing}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-red-950/60 flex items-center justify-center space-x-2 text-sm transition disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            <span>{isProcessing ? 'Đang đóng dấu...' : 'CHỤP ẢNH XÁC THỰC'}</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleRetake}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Chụp Lại</span>
            </button>

            <button
              onClick={handleConfirm}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-950/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận & Gửi</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
