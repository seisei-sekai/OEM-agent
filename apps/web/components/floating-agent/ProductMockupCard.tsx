'use client';

import { Sparkles } from 'lucide-react';

interface ProductMockupCardProps {
    imageUrl: string;
    productName?: string;
    companyName?: string;
}

export function ProductMockupCard({ imageUrl, productName, companyName }: ProductMockupCardProps) {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 my-3 max-w-lg">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">
                    {productName || 'Product Mockup'}
                    {companyName && <span className="text-gray-600 font-normal"> with {companyName} logo</span>}
                </span>
            </div>

            {/* Mockup Image */}
            <div className="rounded-lg overflow-hidden border-2 border-white shadow-lg bg-white">
                <img
                    src={imageUrl}
                    alt={`${productName || 'Product'} mockup${companyName ? ` with ${companyName} logo` : ''}`}
                    className="w-full h-auto"
                    loading="lazy"
                    onError={(e) => {
                        console.error('Failed to load mockup image:', imageUrl);
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EImage failed to load%3C/text%3E%3C/svg%3E';
                    }}
                />
            </div>

            {/* Footer Info */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>🎨 AI Generated Mockup</span>
                <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                >
                    Open in new tab
                </a>
            </div>
        </div>
    );
}

