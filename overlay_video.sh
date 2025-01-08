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
BACKGROUND="static/greenscreen.png"

# Background image dimensions (reference size)
BG_WIDTH=768
BG_HEIGHT=576

# Absolute pixel positions for overlay
OVERLAY_X=141  # Exact pixel position from left
OVERLAY_Y=100   # Exact pixel position from top

# Overlay dimensions as percentage of background
OVERLAY_WIDTH_PERCENT=66.9  # This will make overlay ~515px wide on 768px background
OVERLAY_HEIGHT_PERCENT=65.0  # This will make overlay ~382px high on 576px background

# Calculate actual dimensions from percentages
OVERLAY_WIDTH=$(printf "%.0f" $(echo "$BG_WIDTH * $OVERLAY_WIDTH_PERCENT / 100" | bc -l))
OVERLAY_HEIGHT=$(printf "%.0f" $(echo "$BG_HEIGHT * $OVERLAY_HEIGHT_PERCENT / 100" | bc -l))

# CRT effect settings
ENABLE_CRT=true  # Toggle for CRT effect
CRT_K1=0.02
CRT_K2=0.02
CURVE_SCALE_FACTOR=1.05

# Calculate center-based position adjustments for CRT effect
if [ "$ENABLE_CRT" = true ]; then
    # Calculate the center point of the overlay
    CENTER_X=$(printf "%.0f" $(echo "$OVERLAY_X + ($OVERLAY_WIDTH / 2)" | bc -l))
    CENTER_Y=$(printf "%.0f" $(echo "$OVERLAY_Y + ($OVERLAY_HEIGHT / 2)" | bc -l))
    
    # Calculate the distance from center to edges
    HALF_WIDTH=$(printf "%.0f" $(echo "$OVERLAY_WIDTH / 2" | bc -l))
    HALF_HEIGHT=$(printf "%.0f" $(echo "$OVERLAY_HEIGHT / 2" | bc -l))
    
    # Apply scale factor to maintain symmetry around center
    SCALED_HALF_WIDTH=$(printf "%.0f" $(echo "$HALF_WIDTH * $CURVE_SCALE_FACTOR" | bc -l))
    SCALED_HALF_HEIGHT=$(printf "%.0f" $(echo "$HALF_HEIGHT * $CURVE_SCALE_FACTOR" | bc -l))
    
    # Calculate new position based on scaled center point
    ADJUSTED_X=$(printf "%.0f" $(echo "$CENTER_X - $SCALED_HALF_WIDTH" | bc -l))
    ADJUSTED_Y=$(printf "%.0f" $(echo "$CENTER_Y - $SCALED_HALF_HEIGHT" | bc -l))
    
    # Debug output
    echo "Center point: ($CENTER_X, $CENTER_Y)"
    echo "Original dimensions: ${OVERLAY_WIDTH}x${OVERLAY_HEIGHT}"
    echo "Scaled dimensions: $((SCALED_HALF_WIDTH*2))x$((SCALED_HALF_HEIGHT*2))"
    echo "Adjusted position: ($ADJUSTED_X, $ADJUSTED_Y)"
else
    ADJUSTED_X=$OVERLAY_X
    ADJUSTED_Y=$OVERLAY_Y
fi

# Padding type: "stretch" or "pad"
PADDING_TYPE="pad"

# Create the ffmpeg filter chain
SCALE_FILTER="[1:v]scale=${OVERLAY_WIDTH}:${OVERLAY_HEIGHT}:force_original_aspect_ratio=decrease"
if [ "$PADDING_TYPE" = "pad" ]; then
    SCALE_FILTER="${SCALE_FILTER},pad=${OVERLAY_WIDTH}:${OVERLAY_HEIGHT}:(ow-iw)/2:(oh-ih)/2"
fi

# Build the filter chain based on CRT toggle
if [ "$ENABLE_CRT" = true ]; then
    FILTER_CHAIN="${SCALE_FILTER},\
        format=rgba,\
        lenscorrection=k1=${CRT_K1}:k2=${CRT_K2},\
        scale=iw*${CURVE_SCALE_FACTOR}:ih*${CURVE_SCALE_FACTOR}[scaled]"
else
    FILTER_CHAIN="${SCALE_FILTER},\
        format=rgba[scaled]"
fi

# Execute ffmpeg command
ffmpeg -i "$BACKGROUND" -i "$INPUT_VIDEO" \
    -filter_complex "\
        ${FILTER_CHAIN};\
        [0:v][scaled]overlay=${ADJUSTED_X}:${ADJUSTED_Y}[v]" \
    -map "[v]" \
    -map 1:a \
    -c:v libx264 \
    -c:a copy \
    -preset ultrafast \
    "$OUTPUT_FILE"

# Print completion message
echo "Video processing complete. Output saved as: $OUTPUT_FILE" 

