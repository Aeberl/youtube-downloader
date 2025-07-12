from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import StreamingHttpResponse, HttpResponse
import requests
import yt_dlp
import re, os, tempfile, shutil, traceback
import subprocess
from django.conf import settings
from ffmpeg import input as ff_input, output as ff_output
import pysrt
from django.http import FileResponse
import traceback
import ffmpeg

class TrimVideoView(APIView):
    def post(self, request):
        temp_dir = tempfile.mkdtemp()
        try:
            input_path = os.path.join(temp_dir, 'input.mp4')
            output_path = os.path.join(temp_dir, 'output.mp4')
            
            # Save uploaded video
            with open(input_path, 'wb') as f:
                for chunk in request.FILES['video'].chunks():
                    f.write(chunk)
            
            # Get trim parameters
            start = float(request.data.get('start', 0))
            end = float(request.data.get('end', 10))
            
            # Validate trim range
            if start >= end:
                return Response({'error': 'End time must be after start time'}, status=400)
            
            # Get video duration for validation
            probe = ffmpeg.probe(input_path)
            video_duration = float(probe['format']['duration'])
            
            if end > video_duration:
                end = video_duration

                # Calculate duration of the clip
            clip_duration = end - start
            
            # Trim using both start and end positions
            (
                ffmpeg
                .input(input_path, ss=start)
                .output(output_path, t=clip_duration, c='copy')
                .run(overwrite_output=True, quiet=False)
            )
            # Return file response
            with open(output_path, 'rb') as f:
                content = f.read()
            
            response = HttpResponse(content, content_type='video/mp4')
            response['Content-Disposition'] = f'attachment; filename="trimmed_{request.FILES["video"].name}"'
            return response
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

class CaptionVideoView(APIView):
    def post(self, request):
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                # Save uploaded video
                input_path = os.path.join(temp_dir, 'input.mp4')
                with open(input_path, 'wb') as f:
                    for chunk in request.FILES['video'].chunks():
                        f.write(chunk)

                # Write SRT file
                srt_path = os.path.join(temp_dir, 'captions.srt')
                captions = request.data.get('captions', '')
                with open(srt_path, 'w', encoding='utf-8') as f:
                    f.write(captions)

                # Convert path for FFmpeg compatibility
                srt_escaped = srt_path.replace('\\', '/')

                # Updated FFmpeg command to ensure audio is included
                try:
                    stream = ffmpeg.input(input_path)
                    video = stream.video.filter('subtitles', filename=srt_escaped)
                    audio = stream.audio
                    (
                        ffmpeg
                        .output(video, audio, os.path.join(temp_dir, 'output.mp4'),
                                **{'c:v': 'libx264', 'preset': 'fast', 'crf': '23', 'c:a': 'copy'})
                        .global_args('-y')
                        .run(capture_stdout=True, capture_stderr=True)
                    )
                except ffmpeg.Error as e:
                    err = e.stderr.decode('utf-8', errors='ignore')
                    print("FFmpeg Error:\n", err)
                    return Response({
                        'error': 'Failed to burn in captions',
                        'details': err[:1000]
                    }, status=500)

                # Send back the captioned video
                with open(os.path.join(temp_dir, 'output.mp4'), 'rb') as f:
                    data = f.read()
                resp = HttpResponse(data, content_type='video/mp4')
                resp['Content-Disposition'] = (
                    f'attachment; filename="captioned_{request.FILES["video"].name}"'
                )
                return resp

        except Exception:
            tb = traceback.format_exc()
            print(tb)
            return Response({
                'error': 'Internal server error',
                'details': tb.splitlines()[-1]
            }, status=500)

            
class VideoInfoView(APIView):
    """Endpoint to get video metadata and available formats"""
    def post(self, request):
        url = request.data.get('url')
        if not url:
            return Response({'error': 'URL is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        ydl_opts = {
            'noplaylist': True,
            'skip_download': True,
            'quiet': True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                # Extract available formats
                formats = []
                for f in info.get('formats', []):
                    if not f.get('url'):
                        continue
                    
                    # Only include formats that have video and audio, or audio-only for audio formats
                    if f.get('vcodec') != 'none' and f.get('acodec') != 'none':
                        formats.append({
                            'format_id': f['format_id'],
                            'ext': f.get('ext', 'mp4'),
                            'resolution': f.get('resolution', 'unknown'),
                            'filesize': f.get('filesize'),
                            'note': f.get('format_note', ''),
                            'vcodec': f.get('vcodec'),
                            'acodec': f.get('acodec'),
                            'has_audio': f.get('acodec') != 'none',
                        })
                
                # If no combined formats found, include all formats
                if not formats:
                    for f in info.get('formats', []):
                        if f.get('url'):
                            formats.append({
                                'format_id': f['format_id'],
                                'ext': f.get('ext', 'mp4'),
                                'resolution': f.get('resolution', 'unknown'),
                                'filesize': f.get('filesize'),
                                'note': f.get('format_note', ''),
                                'vcodec': f.get('vcodec'),
                                'acodec': f.get('acodec'),
                                'has_audio': f.get('acodec') != 'none',
                            })
                
                # Get best thumbnail
                thumbnails = info.get('thumbnails', [])
                thumbnail = max(
                    thumbnails, 
                    key=lambda t: t.get('width', 0) * t.get('height', 0), 
                    default={}
                ).get('url', '')
                
                return Response({
                    'title': info.get('title', 'Untitled'),
                    'thumbnail': thumbnail,
                    'duration': info.get('duration', 0),
                    'formats': formats,
                })
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DownloadVideoView(APIView):
    """Endpoint to download video in selected format"""
    def post(self, request):
        url = request.data.get('url')
        format_id = request.data.get('format_id')
        audio_only = request.data.get('audio_only', False)

        if not url:
            return Response({'error': 'URL is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Use a temporary directory for processing
        temp_dir = tempfile.mkdtemp()
        try:
            ydl_opts = {
                'noplaylist': True,
                'socket_timeout': 30,
                'ffmpeg_location': settings.FFMPEG_PATH,
                'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
                'verbose': True,
            }

            if audio_only:
                # Audio-only configuration
                ydl_opts['format'] = 'bestaudio/best'
                ydl_opts['postprocessors'] = [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }]
            else:
                # Video with audio configuration - ensure we get both streams
                ydl_opts['format'] = f'{format_id}+bestaudio'
                ydl_opts['merge_output_format'] = 'mp4'

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                
                # Get the downloaded file path
                filename = ydl.prepare_filename(info)
                
                # For audio-only, the extension is changed to mp3
                if audio_only:
                    filename = filename.replace('.webm', '.mp3').replace('.m4a', '.mp3')
                # For video, ensure we get the merged file
                elif not filename.endswith('.mp4'):
                    filename = os.path.splitext(filename)[0] + '.mp4'
                
                # Read the file content
                with open(filename, 'rb') as f:
                    content = f.read()
                
                # Get safe filename
                title = re.sub(r'[^\w\-_\. ]', '', info.get('title', 'video'))
                ext = 'mp3' if audio_only else 'mp4'
                safe_filename = f"{title[:50]}.{ext}"
                
                # Create response
                content_type = 'audio/mpeg' if audio_only else 'video/mp4'
                response = HttpResponse(content, content_type=content_type)
                response['Content-Disposition'] = f'attachment; filename="{safe_filename}"'
                return response
                
        except yt_dlp.utils.DownloadError as e:
            if "Requested format is not available" in str(e):
                return Response({'error': 'This format is unavailable. Try another format.'}, status=400)
            return Response({'error': f"YouTube error: {str(e)}"}, status=400)
        except Exception as e:
            return Response({'error': f"Server error: {str(e)}"}, status=500)
        finally:
            # Clean up temporary directory
            shutil.rmtree(temp_dir, ignore_errors=True)

            # Add new view for combined operation
class CombinedProcessView(APIView):
    def post(self, request):
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                # Save uploaded video
                input_path = os.path.join(temp_dir, 'input.mp4')
                with open(input_path, 'wb') as f:
                    for chunk in request.FILES['video'].chunks():
                        f.write(chunk)
                
                # Get parameters
                start = float(request.data.get('start', 0))
                end = float(request.data.get('end', 10))
                captions = request.data.get('captions', '')
                
                # Step 1: Trim video
                trimmed_path = os.path.join(temp_dir, 'trimmed.mp4')
                probe = ffmpeg.probe(input_path)
                video_duration = float(probe['format']['duration'])
                end = min(end, video_duration)
                clip_duration = end - start
                
                (
                    ffmpeg
                    .input(input_path, ss=start)
                    .output(trimmed_path, t=clip_duration, c='copy')
                    .run(overwrite_output=True, quiet=True)
                )
                
                # Step 2: Add captions
                srt_path = os.path.join(temp_dir, 'captions.srt')
                with open(srt_path, 'w', encoding='utf-8') as f:
                    f.write(captions)
                
                output_path = os.path.join(temp_dir, 'final.mp4')
                srt_escaped = srt_path.replace('\\', '/')
                
                stream = ffmpeg.input(trimmed_path)
                video = stream.video.filter('subtitles', filename=srt_escaped)
                audio = stream.audio
                (
                    ffmpeg
                    .output(video, audio, output_path,
                            **{'c:v': 'libx264', 'preset': 'fast', 'crf': '23', 'c:a': 'copy'})
                    .global_args('-y')
                    .run(quiet=True)
                )
                
                # Return processed video
                with open(output_path, 'rb') as f:
                    data = f.read()
                resp = HttpResponse(data, content_type='video/mp4')
                resp['Content-Disposition'] = (
                    f'attachment; filename="edited_{request.FILES["video"].name}"'
                )
                return resp
                
        except Exception:
            tb = traceback.format_exc()
            return Response({
                'error': 'Combined processing failed',
                'details': tb.splitlines()[-1]
            }, status=500)

class TestFFmpegView(APIView):
    def get(self, request):
        try:
            # Try using the configured binary
            ffmpeg_binary = settings.FFMPEG_PATH if hasattr(settings, 'FFMPEG_PATH') else 'ffmpeg'
            
            result = subprocess.run(
                [ffmpeg_binary, '-version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                return Response({
                    'status': 'success',
                    'version': result.stdout.split('\n')[0]
                })
            else:
                return Response({
                    'error': f"FFmpeg exited with code {result.returncode}",
                    'stderr': result.stderr
                }, status=500)
                
        except FileNotFoundError:
            return Response({
                'error': "FFmpeg not found in PATH",
                'hint': "Install FFmpeg and add it to your system PATH"
            }, status=500)
        except Exception as e:
            return Response({
                'error': f"FFmpeg test failed: {str(e)}",
                'type': type(e).__name__
            }, status=500)