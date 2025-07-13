// src/pages/DownloadPage.js
import React, { useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import DownloadForm from '../components/DownloadForm';
import { useNavigate } from 'react-router-dom';
// import Ad from '../components/Ad';

function DownloadPage() {
  const [videoInfo, setVideoInfo] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [filename, setFilename] = useState('');
  const [videoBlob, setVideoBlob] = useState(null);
  const navigate = useNavigate();
  
  const handleDownloadSuccess = (url, name) => {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        setVideoBlob(blob);
        setDownloadUrl(url);
        setFilename(name);
      });
  };
  
  const goToEditor = () => {
    navigate('/editor', { state: { videoBlob, videoInfo } });
  };
  
  return (
    <Container className="py-4">
      {/* Top Banner Ad */}
  {/*  <div className="mb-4">
        <Ad size="banner" title="Advertisement" />
    </div> */}
      
      <h1 className="text-center mb-3">Free YouTube Video Downloader</h1>
      <p className="text-center text-muted mb-4">
        Download any YouTube video in high quality. Our free tool lets you save videos 
        for offline viewing and editing.
      </p>
      
      {/* Main Content */}
      <div className="row">
        <div className="col-lg-8">
          <DownloadForm 
            onVideoInfo={setVideoInfo}
            onDownloadSuccess={handleDownloadSuccess}
          />
          
          {downloadUrl && videoBlob && (
            <div className="mt-4">
              <div className="mb-3">
                {videoInfo?.thumbnail && (
                  <img 
                    src={videoInfo.thumbnail} 
                    alt="Video thumbnail" 
                    className="img-thumbnail"
                    style={{ maxWidth: '320px' }}
                  />
                )}
              </div>
              <h3>{videoInfo?.title}</h3>
              <p className="mb-3">
                <strong>Duration:</strong> {Math.floor(videoInfo?.duration / 60)}:
                {(videoInfo?.duration % 60).toString().padStart(2, '0')}
              </p>
              <a 
                href={downloadUrl} 
                download={filename}
                className="btn btn-success btn-lg me-2"
              >
                Save Video
              </a>
              <Button 
                variant="info" 
                className="btn-lg"
                onClick={goToEditor}
              >
                Edit Video
              </Button>
            </div>
          )}
        </div>
        
        {/* Sidebar with Ads and Info */}
        <div className="col-lg-4">
          <div className="bg-light p-4 rounded mb-4">
            <h4>How to Download YouTube Videos</h4>
            <ol>
              <li>Copy the YouTube video URL</li>
              <li>Paste it in the input field above</li>
              <li>Click "Get Info" to load video details</li>
              <li>Select your preferred format</li>
              <li>Download or edit your video</li>
            </ol>
          </div>
          
      {/*  <Ad size="rectangle" />  */}
          
          <div className="mt-4 bg-light p-4 rounded">
            <h4>Why Use Our Downloader?</h4>
            <ul>
              <li>100% free with no registration</li>
              <li>No watermarks on downloaded videos</li>
              <li>Fast downloads with high quality</li>
              <li>Built-in video editor</li>
              <li>Works on all devices</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="row mt-5">
        <div className="col-md-4 mb-4">
          <div className="text-center p-3 border rounded h-100">
            <h3>Easy Download</h3>
            <p>Download YouTube videos in MP4 format with just a few clicks. No technical skills required.</p>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="text-center p-3 border rounded h-100">
            <h3>Video Trimming</h3>
            <p>Trim your videos to remove unwanted sections. Create perfect clips from longer videos.</p>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="text-center p-3 border rounded h-100">
            <h3>Add Captions</h3>
            <p>Enhance your videos with custom captions. Perfect for social media content creation.</p>
          </div>
        </div>
      </div>
      
      {/* Bottom Ad */}
    {/*  <div className="mt-4">
      <Ad size="banner" title="Advertisement" />
      </div> */}
      
      {/* FAQ Section */}
      <div className="mt-5">
        <h2 className="text-center mb-4">Frequently Asked Questions</h2>
        <div className="accordion" id="faqAccordion">
          <div className="accordion-item">
            <h3 className="accordion-header">
              <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                Is this YouTube downloader free?
              </button>
            </h3>
            <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
              <div className="accordion-body">
                Yes, our YouTube downloader is completely free to use. There are no hidden fees or subscriptions.
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h3 className="accordion-header">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                What video formats are supported?
              </button>
            </h3>
            <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
              <div className="accordion-body">
                We support MP4 video format for downloads. You can choose different resolutions based on what's available for each video.
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h3 className="accordion-header">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                Can I download videos on mobile?
              </button>
            </h3>
            <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
              <div className="accordion-body">
                Yes, our downloader works on all devices including smartphones and tablets. The interface is fully responsive.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default DownloadPage;


