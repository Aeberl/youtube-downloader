#!/bin/bash
gunicorn youtube_downloader.wsgi:application --workers 2 --bind 0.0.0.0:$PORT

