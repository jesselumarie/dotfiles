#!/bin/bash

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "FFmpeg is not installed. Please install it and try again."
    exit 1
fi

# Check if input file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 input.mov"
    exit 1
fi

input_file="$1"
output_file="${input_file%.*}.gif"

# Convert .mov to .gif using FFmpeg
ffmpeg -i "$input_file" -vf "fps=60,scale=720:-1:flags=lanczos" -c:v gif "$output_file"

echo "Conversion complete: $output_file"
