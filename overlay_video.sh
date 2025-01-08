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

# Effect toggles
ENABLE_CRT=false  # Toggle for CRT effect
ENABLE_INTERLACED=true  # Toggle for interlaced effect
ENABLE_HIGHLIGHT=true  # Toggle for highlight effect

# CRT effect settings
CRT_K1=0.02
CRT_K2=0.02
CURVE_SCALE_FACTOR=1.05

# Highlight settings
HIGHLIGHT_X=80  # X position of highlight glow
HIGHLIGHT_Y=60  # Y position of highlight glow
HIGHLIGHT_SIZE=90  # Size of highlight glow
HIGHLIGHT_BLUR=7  # Blur amount for highlight

# Calculate position adjustments for CRT effect
if [ "$ENABLE_CRT" = true ]; then
    # Scale from center point in one calculation
    SCALE_OFFSET_X=$(printf "%.0f" $(echo "($OVERLAY_WIDTH * ($CURVE_SCALE_FACTOR - 1)) / 2" | bc -l))
    SCALE_OFFSET_Y=$(printf "%.0f" $(echo "($OVERLAY_HEIGHT * ($CURVE_SCALE_FACTOR - 1)) / 2" | bc -l))
    ADJUSTED_X=$((OVERLAY_X - SCALE_OFFSET_X))
    ADJUSTED_Y=$((OVERLAY_Y - SCALE_OFFSET_Y))
    
    # Debug output
    echo "Scale offsets: (${SCALE_OFFSET_X}, ${SCALE_OFFSET_Y})"
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

# Build the highlight filter if enabled
HIGHLIGHT_FILTER=""
if [ "$ENABLE_HIGHLIGHT" = true ]; then
    HIGHLIGHT_FILTER="split [main][for_highlight];
        [for_highlight] format=gbrp,
        drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSerif.ttf:
        text='¡':x=${HIGHLIGHT_X}:y=${HIGHLIGHT_Y}:
        fontsize=${HIGHLIGHT_SIZE}:fontcolor=white,
        boxblur=${HIGHLIGHT_BLUR} [highlight];
        [main][highlight] blend=all_mode=screen:shortest=1"
fi

# Build the filter chain based on effects toggle
if [ "$ENABLE_CRT" = true ]; then
    if [ "$ENABLE_INTERLACED" = true ]; then
        FILTER_CHAIN="${SCALE_FILTER},\
            split[a][b];\
            [a]curves=darker[a];\
            [a][b]blend=all_expr='if(eq(0,mod(Y,2)),A,B)':shortest=1"
        
        if [ "$ENABLE_HIGHLIGHT" = true ]; then
            FILTER_CHAIN="${FILTER_CHAIN},\
                ${HIGHLIGHT_FILTER}"
        fi
        
        FILTER_CHAIN="${FILTER_CHAIN},\
            format=rgba,\
            lenscorrection=k1=${CRT_K1}:k2=${CRT_K2},\
            scale=iw*${CURVE_SCALE_FACTOR}:ih*${CURVE_SCALE_FACTOR}[scaled]"
    else
        FILTER_CHAIN="${SCALE_FILTER}"
        
        if [ "$ENABLE_HIGHLIGHT" = true ]; then
            FILTER_CHAIN="${FILTER_CHAIN},\
                ${HIGHLIGHT_FILTER}"
        fi
        
        FILTER_CHAIN="${FILTER_CHAIN},\
            format=rgba,\
            lenscorrection=k1=${CRT_K1}:k2=${CRT_K2},\
            scale=iw*${CURVE_SCALE_FACTOR}:ih*${CURVE_SCALE_FACTOR}[scaled]"
    fi
else
    if [ "$ENABLE_INTERLACED" = true ]; then
        FILTER_CHAIN="${SCALE_FILTER},\
            split[a][b];\
            [a]curves=darker[a];\
            [a][b]blend=all_expr='if(eq(0,mod(Y,2)),A,B)':shortest=1"
        
        if [ "$ENABLE_HIGHLIGHT" = true ]; then
            FILTER_CHAIN="${FILTER_CHAIN},\
                ${HIGHLIGHT_FILTER}"
        fi
        
        FILTER_CHAIN="${FILTER_CHAIN},\
            format=rgba[scaled]"
    else
        FILTER_CHAIN="${SCALE_FILTER}"
        
        if [ "$ENABLE_HIGHLIGHT" = true ]; then
            FILTER_CHAIN="${FILTER_CHAIN},\
                ${HIGHLIGHT_FILTER}"
        fi
        
        FILTER_CHAIN="${FILTER_CHAIN},\
            format=rgba[scaled]"
    fi
fi

# Debug output for chosen filter chain
echo "Using filter chain: ${FILTER_CHAIN}"

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

