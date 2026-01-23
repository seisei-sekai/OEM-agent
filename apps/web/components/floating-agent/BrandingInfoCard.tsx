'use client';

import { Check, Star } from 'lucide-react';

interface BrandingInfoCardProps {
  branding: {
    companyName?: string;
    logos: Array<{ url: string; width?: number; height?: number }>;
    colors: string[];
    websiteUrl?: string;
  };
  onConfirm: () => void;
  onUploadDifferent: () => void;
}

export function BrandingInfoCard({ branding, onConfirm, onUploadDifferent }: BrandingInfoCardProps) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 my-3 max-w-md">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-purple-600" />
        <span className="font-medium text-gray-900">Branding info</span>
      </div>

      {/* Logo Section */}
      {branding.logos && branding.logos.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-700 mb-2">Logo</div>
          <div className="relative bg-white border-2 border-gray-200 rounded-lg p-6 flex items-center justify-center">
            <img
              src={branding.logos[0].url}
              alt={branding.companyName || 'Company logo'}
              className="max-w-full max-h-32 object-contain"
            />
            <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
          {branding.companyName && (
            <div className="text-center text-sm text-gray-600 mt-2">
              {branding.companyName}
            </div>
          )}
        </div>
      )}

      {/* Colors Section */}
      {branding.colors && branding.colors.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-700 mb-2">Brand Colors</div>
          <div className="flex gap-2">
            {branding.colors.slice(0, 5).map((color, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded-full border-2 border-gray-200"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Website URL */}
      {branding.websiteUrl && (
        <div className="mb-4 text-xs text-gray-500 truncate">
          {branding.websiteUrl}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onConfirm}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Confirm
        </button>
        <button
          onClick={onUploadDifferent}
          className="w-full text-left text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          <span>→</span>
          <span>Upload a different design</span>
        </button>
      </div>
    </div>
  );
}


