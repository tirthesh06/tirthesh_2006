import React, { useEffect, useRef, useState } from 'react';
import Modal from './Modal';

// Make Html5Qrcode globally available from the script tag in index.html
declare var Html5Qrcode: any;

interface QRCodeScannerProps {
  onClose: () => void;
  onScanSuccess: (studentId: string) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onClose, onScanSuccess }) => {
  const scannerRef = useRef<any>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const [scanResult, setScanResult] = useState<{ type: 'error'; message: string } | null>(null);
  
  useEffect(() => {
    // This check prevents re-initializing the scanner on re-renders
    if (!readerRef.current || scannerRef.current) return;

    const html5QrCode = new Html5Qrcode(readerRef.current.id);
    scannerRef.current = html5QrCode;

    const qrCodeSuccessCallback = (decodedText: string) => {
      if(scanResult) return; // Don't process if an error is already shown

      scannerRef.current.pause();

      try {
        const decodedData = JSON.parse(atob(decodedText));
        const { studentId, timestamp } = decodedData;
        
        if (!studentId || !timestamp) {
          throw new Error("Invalid QR code data.");
        }

        const timeDiffSeconds = (Date.now() - timestamp) / 1000;
        if (timeDiffSeconds > 60) {
           setScanResult({ type: 'error', message: 'Expired QR Code. Please ask the student to generate a new one.' });
           return;
        }
        
        onScanSuccess(studentId);

      } catch (e) {
        setScanResult({ type: 'error', message: 'Invalid or unreadable QR code format.' });
      }
    };
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
    
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, undefined)
      .catch(() => {
         setScanResult({ type: 'error', message: 'Could not start camera. Please check permissions.'});
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch((err: any) => console.error("Failed to stop scanner", err));
        scannerRef.current = null;
      }
    };
  }, [onScanSuccess, scanResult]);

  const handleRetry = () => {
    setScanResult(null);
    scannerRef.current?.resume();
  }
  
  return (
    <Modal title="Scan Student QR Code" onClose={onClose}>
        <div className="w-full max-w-md mx-auto relative">
           <div id="qr-reader" ref={readerRef} className="w-full border-2 border-gray-600 rounded-lg overflow-hidden bg-black"></div>
           {scanResult ? (
             <div className="absolute inset-0 bg-gray-800/90 flex flex-col items-center justify-center text-center p-4">
                <svg className="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xl font-bold text-red-400">Scan Failed</p>
                <p className="text-gray-300 mt-2">{scanResult.message}</p>
                <div className="flex gap-4 mt-6">
                    <button onClick={handleRetry} className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700">Scan Again</button>
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-700">Close</button>
                </div>
            </div>
           ) : (
            <p className="text-white text-center mt-4">Point camera at student's QR code</p>
           )}
        </div>
    </Modal>
  );
};

export default QRCodeScanner;
