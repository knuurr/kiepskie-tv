#!/bin/bash

# Debug mode - print commands as they are executed
set -x

# Check if required arguments are provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <input_video>"
    exit 1
fi

INPUT_VIDEO="$1"
OUTPUT_FILE="${1%.*}_output.${1##*.}"
BACKGROUND="static/greenscreen.png"  # Background image path

# Configuration values from the JSON
IMAGE_WIDTH=768
IMAGE_HEIGHT=576
MAX_WIDTH=512
MAX_HEIGHT=382
PAD_WIDTH=512
PAD_HEIGHT=382
OFFSET_X=140
OFFSET_Y=94

# Create the ffmpeg command with overlay filter
ffmpeg -i "$BACKGROUND" -i "$INPUT_VIDEO" \
    -filter_complex "[1:v]scale=${MAX_WIDTH}:${MAX_HEIGHT}:force_original_aspect_ratio=decrease,pad=${PAD_WIDTH}:${PAD_HEIGHT}:(ow-iw)/2:(oh-ih)/2[scaled]; \
                     [0:v][scaled]overlay=${OFFSET_X}:${OFFSET_Y}[v]" \
    -map "[v]" \
    -map 1:a \
    -c:v libx264 \
    -c:a copy \
    -preset ultrafast \
    "$OUTPUT_FILE"

# Print completion message
echo "Video processing complete. Output saved as: $OUTPUT_FILE" 