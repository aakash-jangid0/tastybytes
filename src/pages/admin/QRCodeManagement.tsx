import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Plus, Trash2, Upload } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { useGuestGuard } from '../../hooks/useGuestGuard';

interface QRCode {
  id: string;
  tableNumber: string;
  url: string;
}

function QRCodeManagement() {
  const { isGuest, guardAction } = useGuestGuard();
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd] = useState('');
  const baseUrl = window.location.origin;

  const generateQRCode = () => {
    if (!tableNumber.trim()) {
      toast.error('Please enter a table number');
      return;
    }

    const newQRCode: QRCode = {
      id: Date.now().toString(),
      tableNumber: tableNumber.trim(),
      url: `${baseUrl}?table=${tableNumber.trim()}`
    };

    setQRCodes([...qrCodes, newQRCode]);
    setTableNumber('');
    toast.success('QR Code generated successfully');
  };

  const generateBulkQRCodes = () => {
    const start = parseInt(bulkStart);
    const end = parseInt(bulkEnd);

    if (isNaN(start) || isNaN(end) || start > end || start < 1) {
      toast.error('Please enter valid table numbers');
      return;
    }

    if (end - start > 50) {
      toast.error('You can generate maximum 50 QR codes at once');
      return;
    }

    const newQRCodes: QRCode[] = [];
    for (let i = start; i <= end; i++) {
      newQRCodes.push({
        id: Date.now().toString() + i,
        tableNumber: i.toString(),
        url: `${baseUrl}?table=${i}`
      });
    }

    setQRCodes([...qrCodes, ...newQRCodes]);
    setBulkStart('');
    setBulkEnd('');
    toast.success(`Generated ${newQRCodes.length} QR codes`);
  };

  const deleteQRCode = (id: string) => {
    setQRCodes(qrCodes.filter(qr => qr.id !== id));
    toast.success('QR Code deleted');
  };

  const downloadQRCode = async (tableNumber: string) => {
    try {
      const qrElement = document.getElementById(`qr-${tableNumber}`);
      if (!qrElement) {
        throw new Error('QR Code element not found');
      }

      // Create a canvas element
      const canvas = document.createElement('canvas');
      const svgData = new XMLSerializer().serializeToString(qrElement);
      const img = new Image();

      // Create a Blob from the SVG data
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Wait for the image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgUrl;
      });

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image on the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      ctx.drawImage(img, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob(blob => resolve(blob!), 'image/png')
      );

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `table-${tableNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(svgUrl);
      toast.success('QR Code downloaded successfully');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR Code');
    }
  };

  const downloadAllQRCodes = async () => {
    if (qrCodes.length === 0) {
      toast.error('No QR codes to download');
      return;
    }

    try {
      const zip = new JSZip();
      
      // Create all QR code images
      const promises = qrCodes.map(async (qr) => {
        const qrElement = document.getElementById(`qr-${qr.tableNumber}`);
        if (!qrElement) return;

        const canvas = document.createElement('canvas');
        const svgData = new XMLSerializer().serializeToString(qrElement);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = svgUrl;
        });

        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        
        ctx.drawImage(img, 0, 0);
        
        return new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              zip.file(`table-${qr.tableNumber}-qr.png`, blob);
            }
            URL.revokeObjectURL(svgUrl);
            resolve();
          }, 'image/png');
        });
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'qr-codes.zip');
      toast.success('All QR Codes downloaded successfully');
    } catch (error) {
      console.error('Error downloading QR codes:', error);
      toast.error('Failed to download QR Codes');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">QR Code Management</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={downloadAllQRCodes}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Download className="w-5 h-5 mr-2" />
          Download All
        </motion.button>
      </div>

      <div className="grid gap-6 mb-8">
        {/* Single QR Code Generator */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Generate Single QR Code</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter table number"
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => guardAction(() => generateQRCode())}
              disabled={isGuest}
              className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5 mr-2" />
              Generate
            </motion.button>
          </div>
        </div>

        {/* Bulk QR Code Generator */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Generate Bulk QR Codes</h2>
          <div className="flex gap-4">
            <input
              type="number"
              value={bulkStart}
              onChange={(e) => setBulkStart(e.target.value)}
              placeholder="Start table number"
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <input
              type="number"
              value={bulkEnd}
              onChange={(e) => setBulkEnd(e.target.value)}
              placeholder="End table number"
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => guardAction(() => generateBulkQRCodes())}
              disabled={isGuest}
              className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5 mr-2" />
              Generate Bulk
            </motion.button>
          </div>
        </div>

        {/* QR Codes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qr) => (
            <motion.div
              key={qr.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center"
            >
              <div className="text-lg font-semibold mb-4">Table {qr.tableNumber}</div>
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <QRCodeSVG
                  id={`qr-${qr.tableNumber}`}
                  value={qr.url}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => downloadQRCode(qr.tableNumber)}
                  className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => guardAction(() => deleteQRCode(qr.id))}
                  disabled={isGuest}
                  className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {qrCodes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-gray-500">No QR codes generated yet. Add a table number to get started.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QRCodeManagement;