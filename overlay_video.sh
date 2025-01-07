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

# CRT curve effect configuration
# Adjust these values to control the curve intensity
# k1: barrel distortion (0.1 to 0.3 recommended)
# k2: fine-tuning of the curve (0.1 to 0.3 recommended)
CRT_K1=0.01
CRT_K2=0.05

# Scale factor to compensate for curve distortion (0.95 to 1.05 range)
# Values > 1.0 will enlarge the curved image
# Values < 1.0 will shrink the curved image
CURVE_SCALE_FACTOR=1

# Create the ffmpeg command with overlay filter
ffmpeg -i "$BACKGROUND" -i "$INPUT_VIDEO" \
    -filter_complex "\
        [1:v]scale=${MAX_WIDTH}:${MAX_HEIGHT}:force_original_aspect_ratio=decrease,\
        pad=${PAD_WIDTH}:${PAD_HEIGHT}:(ow-iw)/2:(oh-ih)/2,\
        format=rgba,\
        lenscorrection=k1=${CRT_K1}:k2=${CRT_K2},\
        scale=iw*${CURVE_SCALE_FACTOR}:ih*${CURVE_SCALE_FACTOR}[scaled],\
        [0:v][scaled]overlay=${OFFSET_X}:${OFFSET_Y}[v]" \
    -map "[v]" \
    -map 1:a \
    -c:v libx264 \
    -c:a copy \
    -preset ultrafast \
    "$OUTPUT_FILE"

# Print completion message
echo "Video processing complete. Output saved as: $OUTPUT_FILE" 

