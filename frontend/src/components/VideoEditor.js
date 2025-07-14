import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, 
  Container, 
  Row, 
  Col, 
  Form, 
  ProgressBar, 
  Table, 
  Spinner 
} from 'react-bootstrap';
import axios from 'axios';

// Format seconds to HH:MM:SS
const formatTime = seconds => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
};

// Format seconds to SRT timestamp (HH:MM:SS,mmm)
const formatSrtTime = seconds => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);
  return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')},${ms.toString().padStart(3,'0')}`;
};

const VideoEditor = ({ videoBlob, videoTitle, onSave }) => {
  // Trim states
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Caption states
  const [captions, setCaptions] = useState([]);
  const [currentCaption, setCurrentCaption] = useState({
    text: '',
    start: 0,
    end: 0
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null);
  const [combinedProcessing, setCombinedProcessing] = useState(false);

  // Video loading state
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Current video state
  const [currentVideoBlob, setCurrentVideoBlob] = useState(videoBlob);

  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState('');

  // Generate object URL for current video blob
  useEffect(() => {
    if (!currentVideoBlob) return;
    const url = URL.createObjectURL(currentVideoBlob);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [currentVideoBlob]);

  // Track video time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoLoaded) return;
    
    const updateTime = () => setCurrentTime(video.currentTime);
    video.addEventListener('timeupdate', updateTime);
    return () => video.removeEventListener('timeupdate', updateTime);
  }, [videoUrl, videoLoaded]);

  // Handle slider changes
  const handleStartChange = e => {
    const value = parseFloat(e.target.value);
    setTrimStart(Math.min(value, trimEnd));
  };

  const handleEndChange = e => {
    const value = parseFloat(e.target.value);
    setTrimEnd(Math.max(value, trimStart));
  };

  // Preview functions
  const previewStartSegment = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = trimStart;
    video.play();
    
    const onTimeUpdate = () => {
      if (video.currentTime >= duration) {
        video.pause();
        video.removeEventListener('timeupdate', onTimeUpdate);
      }
    };
    
    video.addEventListener('timeupdate', onTimeUpdate);
  };

  const previewEndSegment = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = 0;
    video.play();
    
    const onTimeUpdate = () => {
      if (video.currentTime >= trimEnd) {
        video.pause();
        video.removeEventListener('timeupdate', onTimeUpdate);
      }
    };
    
    video.addEventListener('timeupdate', onTimeUpdate);
  };

  const previewFullSegment = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = trimStart;
    video.play();
    
    const onTimeUpdate = () => {
      if (video.currentTime >= trimEnd) {
        video.pause();
        video.removeEventListener('timeupdate', onTimeUpdate);
      }
    };
    
    video.addEventListener('timeupdate', onTimeUpdate);
  };

  // Trim the video and update current video
  const handleTrim = async () => {
    if (trimStart >= trimEnd) {
      alert('End time must be after start time');
      return;
    }
    
    setProcessing(true);
    try {
      const fd = new FormData();
      fd.append('video', new File([currentVideoBlob], `${videoTitle}.mp4`));
      fd.append('start', trimStart.toFixed(2));
      fd.append('end', trimEnd.toFixed(2));

      
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/trim/`, fd, {
        responseType: 'blob',
        onUploadProgress: e => setProgress(Math.round(e.loaded * 100 / e.total)),
      });
      
      setCurrentVideoBlob(res.data);
      // Reset trim sliders to new duration after trimming
      const video = videoRef.current;
      if (video) {
        video.onloadedmetadata = () => {
          setDuration(video.duration);
          setTrimStart(0);
          setTrimEnd(video.duration);
        };
      }
    } catch (err) {
      console.error(err);
      alert('Error trimming video');
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  // Set caption start time to current video time
  const setStartTime = () => {
    setCurrentCaption(prev => ({
      ...prev,
      start: currentTime
    }));
  };

  // Set caption end time to current video time
  const setEndTime = () => {
    setCurrentCaption(prev => ({
      ...prev,
      end: currentTime
    }));
  };
  
  // Add or update caption
  const handleAddCaption = () => {
    if (!currentCaption.text.trim()) {
      alert('Please enter caption text');
      return;
    }
    
    if (currentCaption.start >= currentCaption.end) {
      alert('End time must be after start time');
      return;
    }
    
    if (editingIndex !== null) {
      const updatedCaptions = [...captions];
      updatedCaptions[editingIndex] = currentCaption;
      setCaptions(updatedCaptions);
      setEditingIndex(null);
    } else {
      setCaptions(prev => [...prev, currentCaption]);
    }
    
    setCurrentCaption({
      text: '',
      start: 0,
      end: 0
    });
  };

  // Edit existing caption
  const handleEditCaption = (index) => {
    setCurrentCaption(captions[index]);
    setEditingIndex(index);
  };

  // Delete caption
  const handleDeleteCaption = (index) => {
    const newCaptions = [...captions];
    newCaptions.splice(index, 1);
    setCaptions(newCaptions);
  };

  // Preview a specific caption
  const previewCaption = (caption) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = caption.start;
    video.play();
    
    const onTimeUpdate = () => {
      if (video.currentTime >= caption.end) {
        video.pause();
        video.removeEventListener('timeupdate', onTimeUpdate);
      }
    };
    
    video.addEventListener('timeupdate', onTimeUpdate);
  };

  // Convert captions to SRT format
  const convertToSrt = () => {
    return captions.map((caption, index) => {
      return `${index + 1}\n` +
        `${formatSrtTime(caption.start)} --> ${formatSrtTime(caption.end)}\n` +
        `${caption.text}\n`;
    }).join('\n');
  };

  // Add captions to current video
  const handleCaption = async () => {
    if (captions.length === 0) {
      alert('Please add at least one caption');
      return;
    }
    
    setProcessing(true);
    try {
      const srt = convertToSrt();
      const fd = new FormData();
      fd.append('video', new File([currentVideoBlob], `${videoTitle}.mp4`));
      fd.append('captions', srt);
      
      
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/caption/`, fd, {
        responseType: 'blob',
        onUploadProgress: e => setProgress(Math.round(e.loaded * 100 / e.total)),
      });
      
      onSave(new Blob([res.data], { type: 'video/mp4' }), `captioned_${videoTitle}.mp4`);
    } catch (err) {
      console.error('Caption Error:', err);
      let errorMessage = 'Error adding captions';
      if (err.response && err.response.data) {
        try {
          const errorData = JSON.parse(await err.response.data.text());
          errorMessage += `: ${errorData.error || errorData.details || 'Unknown error'}`;
        } catch (e) {
          errorMessage += `: ${err.response.statusText}`;
        }
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      alert(errorMessage);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleTrimAndCaption = async () => {
    if (trimStart >= trimEnd) {
      alert('End time must be after start time');
      return;
    }
    
    if (captions.length === 0) {
      alert('Please add at least one caption');
      return;
    }
    
    setCombinedProcessing(true);
    try {
      const srt = convertToSrt();
      const fd = new FormData();
      fd.append('video', new File([videoBlob], `${videoTitle}.mp4`));
      fd.append('captions', srt);
      fd.append('start', trimStart.toFixed(2));
      fd.append('end', trimEnd.toFixed(2));
      
      
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/combined/`, fd, {
        responseType: 'blob',
        onUploadProgress: e => setProgress(Math.round(e.loaded * 100 / e.total)),
      });
      
      onSave(new Blob([res.data], { type: 'video/mp4' }), `edited_${videoTitle}.mp4`);
    } catch (err) {
      console.error('Combined Processing Error:', err);
      alert('Error processing video');
    } finally {
      setCombinedProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Container className="my-4">
      <h3>Edit Video: {videoTitle}</h3>
      <Row>
        <Col md={6} style={{ position: 'relative', padding: 0, overflow: 'hidden', minHeight: '300px' }}>
          <video 
            ref={videoRef} 
            src={videoUrl} 
            controls
            playsInline 
            style={{ 
              width: '100%', 
              display: videoLoaded ? 'block' : 'none' 
            }} 
            onLoadedMetadata={() => {
              setVideoLoaded(true);
              const v = videoRef.current;
              if (v) {
                const vidDuration = v.duration;
                setDuration(vidDuration);
                setTrimEnd(vidDuration);
              }
            }}
          />
          
          {!videoLoaded && (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-center">
                <Spinner animation="border" role="status" />
                <p className="mt-2">Loading video...</p>
              </div>
            </div>
          )}
          
          {videoLoaded && duration > 0 && (
            <>  
              <div style={{ 
                position: 'absolute', 
                top: '0%',
                bottom: '52%',
                left: `${(trimStart/duration)*100}%`, 
                width: '2px', 
                background: 'red',
                zIndex: 10 
              }} />
              <div style={{ 
                position: 'absolute', 
                top: '0%',
                bottom: '52%',
                left: `${(trimEnd/duration)*100}%`, 
                width: '2px', 
                background: 'red',
                zIndex: 10 
              }} />
            </>
          )}
          
          {processing && <ProgressBar now={progress} label={`${progress}%`} className="mt-2" />}
        </Col>
        
        {videoLoaded ? (
          <Col md={6}>
            <h4>Trim Video</h4>
            {duration > 0 && (
              <>
                <div className="d-flex align-items-center mb-2">
                  <span className="flex-grow-1">Start: {formatTime(trimStart)}</span>
                  <Button size="sm" onClick={previewStartSegment}>Preview</Button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={trimStart}
                  onChange={handleStartChange}
                  className="form-range mb-4"
                />

                <div className="d-flex align-items-center mb-2">
                  <span className="flex-grow-1">End: {formatTime(trimEnd)}</span>
                  <Button size="sm" onClick={previewEndSegment}>Preview</Button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={trimEnd}
                  onChange={handleEndChange}
                  className="form-range mb-4"
                />

                <div className="d-flex gap-2 mb-4">
                  <Button 
                    onClick={handleTrim} 
                    disabled={processing} 
                    className="flex-grow-1"
                  >
                    Trim Video
                  </Button>
                  <Button 
                    variant="info" 
                    onClick={previewFullSegment}
                    disabled={processing}
                  >
                    Preview Trimmed Segment
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => { 
                      setTrimStart(0); 
                      setTrimEnd(duration); 
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </>
            )}

            <h4 className="mt-4">Add Captions</h4>
            <div className="mb-3 bg-light p-3 rounded">
              <p className="text-muted">
                <strong>How to add captions:</strong>
                <ol>
                  <li>Play the video to where you want the caption to start</li>
                  <li>Click "Set Start Time"</li>
                  <li>Play to where you want the caption to end</li>
                  <li>Click "Set End Time"</li>
                  <li>"Enter your caption text here"</li>
                  <li>Click "Add Caption"</li>
                  <li>Click "Apply Captions And Download"</li>
                </ol>
              </p>
              
              <div className="d-flex justify-content-between mb-2">
                <div className="d-flex">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={setStartTime}
                    className="me-2"
                  >
                    Set Start Time
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={setEndTime}
                    className="me-2"
                  >
                    Set End Time
                  </Button>
                  <Button 
                    variant="outline-info" 
                    size="sm"
                    onClick={() => {
                      setStartTime();
                      setTimeout(setEndTime, 100);
                    }}
                    title="Set start to current time and end 3 seconds later"
                  >
                    Quick Add
                  </Button>
                </div>
                <span className="fw-bold">{formatTime(currentTime)}</span>
              </div>
              
              <div className="d-flex mb-3">
                <div className="me-3">
                  <span className="text-muted">Start:</span>
                  <span className="fw-bold ms-1">{formatTime(currentCaption.start)}</span>
                </div>
                <div>
                  <span className="text-muted">End:</span>
                  <span className="fw-bold ms-1">{formatTime(currentCaption.end)}</span>
                </div>
              </div>
              
              <Form.Control
                type="text"
                value={currentCaption.text}
                onChange={e => setCurrentCaption(prev => ({
                  ...prev,
                  text: e.target.value
                }))}
                placeholder="Enter your caption text here"
                className="mb-2"
              />
              
              <div className="d-grid">
                <Button 
                  variant={editingIndex !== null ? "warning" : "primary"}
                  onClick={handleAddCaption}
                  disabled={!currentCaption.text.trim() || currentCaption.start >= currentCaption.end}
                >
                  {editingIndex !== null ? "Update Caption" : "Add Caption"}
                </Button>
              </div>
            </div>
            
            {captions.length > 0 && (
              <>
                <h5>Caption Timeline</h5>
                <div className="caption-timeline mb-3">
                  <div 
                    className="timeline-bar" 
                    style={{ 
                      position: 'relative', 
                      height: '30px', 
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px'
                    }}
                  >
                    {captions.map((caption, index) => (
                      <div 
                        key={index}
                        className="caption-segment"
                        style={{
                          position: 'absolute',
                          left: `${(caption.start / duration) * 100}%`,
                          width: `${Math.max(1, ((caption.end - caption.start) / duration) * 100)}%`,
                          height: '100%',
                          backgroundColor: '#0d6efd',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          overflow: 'hidden'
                        }}
                        onClick={() => previewCaption(caption)}
                        title={`${formatTime(caption.start)} - ${formatTime(caption.end)}: ${caption.text}`}
                      >
                        <span style={{
                          display: 'block',
                          fontSize: '10px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          padding: '2px',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {caption.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <h5>Your Captions</h5>
                <Table striped bordered hover size="sm" className="mb-3">
                  <thead>
                    <tr>
                      <th>Start</th>
                      <th>End</th>
                      <th>Text</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {captions.map((caption, index) => (
                      <tr key={index}>
                        <td>{formatTime(caption.start)}</td>
                        <td>{formatTime(caption.end)}</td>
                        <td>{caption.text}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => previewCaption(caption)}
                            className="me-1"
                          >
                            Preview
                          </Button>
                          <Button 
                            variant="outline-warning" 
                            size="sm" 
                            onClick={() => handleEditCaption(index)}
                            className="me-1"
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleDeleteCaption(index)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            )}
            
            <Button 
              variant="success"
              onClick={handleCaption} 
              disabled={processing || captions.length === 0} 
              className="w-100 mt-3"
            >
              {processing ? (
                <>
                  <Spinner as="span" size="sm" animation="border" role="status" />
                  <span className="ms-2">Adding Captions...</span>
                </>
              ) : (
                'Apply Captions and Download'
              )}
          </Button>

              <Button 
            variant="primary"
            onClick={handleTrimAndCaption} 
            disabled={processing || combinedProcessing || captions.length === 0} 
            className="w-100 mt-3"
          >
            {combinedProcessing ? (
              <>
                <Spinner as="span" size="sm" animation="border" role="status" />
                <span className="ms-2">Processing...</span>
              </>
            ) : (
              'Trim & Add Captions'
            )}
          </Button>

            <Button 
              variant="primary"
              onClick={() => onSave(currentVideoBlob, `${videoTitle}.mp4`)}
              className="w-100 mt-2"
            >
              Download Original Video
            </Button>
          </Col>
        ) : (
          <Col md={6} className="d-flex align-items-center justify-content-center">
            <div className="text-center">
              <Spinner animation="border" role="status" />
              <p className="mt-2">Preparing editor...</p>
            </div>
          </Col>
        )}
      </Row>
      
    </Container>
  );
};

export default VideoEditor;


