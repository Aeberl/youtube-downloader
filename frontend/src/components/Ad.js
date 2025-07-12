// src/components/Ad.js
import React, { useEffect } from 'react';

const Ad = ({ size = 'banner', title = 'Advertisement' }) => {
  // Define common ad sizes
  const sizes = {
    banner: { width: 728, height: 90 },
    rectangle: { width: 300, height: 250 },
    square: { width: 250, height: 250 }
  };

  // Get dimensions
  const { width, height } = sizes[size] || sizes.banner;
  
  // Initialize Google Ads
  useEffect(() => {
    if (window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('Ad initialization error:', e);
      }
    }
  }, []);

  // Show placeholder if ads aren't loaded
  if (!window.adsbygoogle) {
    return (
      <div className="ad-placeholder text-center mb-4 p-2 border rounded" 
           style={{ 
             minHeight: `${height}px`, 
             minWidth: `${width}px`,
             maxWidth: '100%',
             backgroundColor: '#f8f9fa',
             margin: '0 auto'
           }}>
        <div className="d-flex flex-column justify-content-center align-items-center h-100">
          <small className="text-muted">{title}</small>
          <div className="bg-light border w-100 h-100 d-flex justify-content-center align-items-center">
            <span className="text-muted">{width}×{height} Ad</span>
          </div>
        </div>
      </div>
    );
  }

  // Show real ad
  return (
    <div className="ad-container" style={{ minHeight: `${height}px`, margin: '0 auto' }}>
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-YOUR_CLIENT_ID"
           data-ad-slot="YOUR_AD_SLOT_ID"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default Ad;


