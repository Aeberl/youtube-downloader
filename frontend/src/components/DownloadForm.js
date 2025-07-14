import React, { useState } from 'react';
import { Form, Button, Alert, Row, Col, Card, Spinner } from 'react-bootstrap';
import axios from 'axios';

const DownloadForm = ({ onVideoInfo, onDownloadSuccess }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  
  // ===== ADD THIS STATE =====
  const [audioOnly, setAudioOnly] = useState(false);

  const fetchVideoInfo = async () => {
    const cleanedUrl = cleanYouTubeUrl(url);
    console.log("API URL:", process.env.REACT_APP_API_URL);
    setLoading(true);
    setError('');
    setVideoInfo(null);
    try {
      console.log("Full API Endpoint:", process.env.REACT_APP_API_URL + '/api/info/');
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/info/`, { url: cleanedUrl });
      setVideoInfo(response.data);
      onVideoInfo(response.data);
      
      // Auto-select the first format with audio
      const formatWithAudio = response.data.formats.find(f => f.acodec !== 'none');
      if (formatWithAudio) {
        setSelectedFormat(formatWithAudio.format_id);
      } else if (response.data.formats.length > 0) {
        setSelectedFormat(response.data.formats[0].format_id);
      }
    } catch (err) {
      setError('Failed to get video info. Please check the URL.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedFormat) {
      setError('Please select a format');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
     
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/download/`, 
        { 
          url, 
          format_id: selectedFormat,
          audio_only: audioOnly  // Add this
        },
        { responseType: 'blob' }
      );
      
      // Create downloadable URL
      const blob = new Blob([response.data], { type: response.data.type });
      const downloadUrl = URL.createObjectURL(blob);
      
      // Extract filename from response
      let filename = 'video.mp4';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }

      onDownloadSuccess(downloadUrl, filename);
    } catch (err) {
      setError('Failed to download video. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Clean YouTube URL
  const cleanYouTubeUrl = (url) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com')) {
        const videoId = parsed.searchParams.get('v');
        if (videoId) {
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  return (
    <div className="mb-4">
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>YouTube URL</Form.Label>
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading || loading}
            />
            <Button 
              variant="primary" 
              onClick={fetchVideoInfo}
              disabled={loading || !url}
              className="ms-2"
            >
              {loading ? <Spinner size="sm" animation="border" /> : 'Get Info'}
            </Button>
          </div>
        </Form.Group>
        
        {videoInfo && (
          <Card className="mb-3">
            <Card.Body>
              <Row>
                <Col md={4} className="text-center">
                  {videoInfo.thumbnail && (
                    <div className="position-relative">
                      <img 
                        src={videoInfo.thumbnail} 
                        alt="Thumbnail" 
                        className="img-fluid rounded"
                        style={{ maxHeight: '180px' }}
                      />
                      <div className="position-absolute bottom-0 end-0 bg-dark text-white px-2 py-1 rounded">
                        {formatDuration(videoInfo.duration)}
                      </div>
                    </div>
                  )}
                </Col>
                <Col md={8}>
                  <h4 className="mb-3">{videoInfo.title}</h4>
                  
                  {/* ===== ADD THIS CHECKBOX GROUP ===== */}
                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="checkbox"
                      label="Audio Only (MP3)"
                      checked={audioOnly}
                      onChange={(e) => {
                        setAudioOnly(e.target.checked);
                        if (e.target.checked) {
                          // Auto-select first audio format
                          const audioFormat = videoInfo.formats.find(
                            f => f.acodec !== 'none' && f.vcodec === 'none'
                          );
                          if (audioFormat) {
                            setSelectedFormat(audioFormat.format_id);
                          } else {
                            // Fallback to best audio format
                            const bestAudio = videoInfo.formats.find(
                              f => f.acodec !== 'none' && f.ext === 'm4a'
                            );
                            if (bestAudio) setSelectedFormat(bestAudio.format_id);
                          }
                        }
                      }}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Select Format:</Form.Label>
                    <Form.Select 
                      value={selectedFormat} 
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      disabled={audioOnly}  // Disable when audio-only is selected
                    >
                      {videoInfo.formats.map((format) => (
                        <option key={format.format_id} value={format.format_id}>
                          {format.resolution || 'Audio'} - 
                          {format.note ? ` ${format.note}` : ''} - 
                          {format.ext.toUpperCase()} - 
                          {format.filesize ? ` ${Math.round(format.filesize / 1024)}KB` : ''}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  
                  <div className="d-grid">
                    <Button
                      variant="success"
                      onClick={handleDownload}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" size="sm" animation="border" role="status" />
                          <span className="ms-2">Downloading...</span>
                        </>
                      ) : (
                        'Download Selected Format'
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </Form>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
};

export default DownloadForm;