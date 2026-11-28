import { useEffect, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { cropImageToFile, ITEM_IMAGE_ASPECT } from '../utils/cropImage';

interface ImageCropperProps {
  file: File;
  aspect?: number;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}

/** Full-screen dialog where the user drags and zooms a photo to fit a fixed frame. */
const ImageCropper = ({ file, aspect = ITEM_IMAGE_ASPECT, onCancel, onConfirm }: ImageCropperProps) => {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleConfirm = async () => {
    if (!area) return;
    setSaving(true);
    setError('');
    try {
      onConfirm(await cropImageToFile(file, area, aspect));
    } catch (err) {
      console.error('Crop error:', err);
      setError('Could not crop this image. Try a different file.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Adjust your photo</h3>
          <p className="text-sm text-gray-500">Drag to move, and zoom so the item fills the frame.</p>
        </div>

        <div className="relative w-full h-80 bg-gray-900">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
          )}
        </div>

        <div className="p-5 space-y-4">
          <label className="flex items-center gap-3 text-sm text-gray-600">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-purple-500"
            />
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!area || saving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 transition-all shadow-md"
            >
              {saving ? 'Cropping...' : 'Use photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
