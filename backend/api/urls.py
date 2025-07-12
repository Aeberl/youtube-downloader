from django.urls import path
from .views import (DownloadVideoView, VideoInfoView, TrimVideoView, CaptionVideoView, CombinedProcessView)
from .views import TestFFmpegView

urlpatterns = [
    path('info/', VideoInfoView.as_view(), name='video-info'),
    path('download/', DownloadVideoView.as_view(), name='download-video'),
    path('test-ffmpeg/', TestFFmpegView.as_view()),
    path('trim/', TrimVideoView.as_view(), name='trim-video'),
    path('caption/', CaptionVideoView.as_view(), name='caption-video'),
    path('combined/', CombinedProcessView.as_view(), name='combined-process'),
]

