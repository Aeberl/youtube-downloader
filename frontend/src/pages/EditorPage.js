// src/pages/EditorPage.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VideoEditor from '../components/VideoEditor';
import { Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa'; // Using FontAwesome instead
import Ad from '../components/Ad';

function EditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { videoBlob, videoInfo } = location.state || {};
  
  const handleSave = (processedBlob, newFilename) => {
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = newFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!videoBlob || !videoInfo) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <h3>No video selected</h3>
          <p className="text-muted">Please download a video first</p>
          <Button 
            variant="primary"
            onClick={() => navigate('/')}
          >
            Go to Download Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="d-flex align-items-center mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/')}
          className="d-flex align-items-center me-3"
        >
          <FaArrowLeft className="me-1" /> Back to Download
        </Button>
        <h3 className="mb-0">Editing: {videoInfo?.title}</h3>
      </div>
      
      {/* Top Ad */}
    {/* <Ad size="banner" /> */}
      
      <div className="row mt-4">
        <div className="col-lg-9">
          <div className="bg-light p-4 rounded mb-4">
            <h4>Video Editing Guide</h4>
            <p>
              Use our editor to enhance your YouTube videos. Trim unwanted sections and add captions 
              to make your content more engaging. The timeline below shows your video's duration - 
              drag the handles to select the portion you want to keep.
            </p>
          </div>
          
          <VideoEditor 
            videoBlob={videoBlob}
            videoTitle={videoInfo?.title || 'video'}
            onSave={handleSave}
          />
        </div>
        
        <div className="col-lg-3">
        {/*  <Ad size="rectangle" />  */}
          
          <div className="mt-4 bg-light p-4 rounded">
            <h5>Editing Tips</h5>
            <ul>
              <li>Trim videos to optimal length (15-60 seconds for social media)</li>
              <li>Add captions to improve accessibility</li>
              <li>Use quick add for 3-second captions</li>
              <li>Preview before saving</li>
            </ul>
          </div>
          
          <div className="mt-4 bg-light p-4 rounded">
            <h5>Why Add Captions?</h5>
            <ul>
              <li>85% of Facebook videos watched without sound</li>
              <li>Improves accessibility for hearing impaired</li>
              <li>Increases viewer engagement</li>
              <li>Boosts SEO for your videos</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Ad */}
      <div className="mt-4">
      {/*  <Ad size="banner" />  */}
      </div>
    </div>
  );
}

export default EditorPage;