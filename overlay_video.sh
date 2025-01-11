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

# Scale factor for video content (0.0-1.0)
# Controls how much the video is scaled down relative to its container
# Lower values (0.7-0.8): More padding around edges, smaller video
# Higher values (0.9-1.0): Less padding, video fills more space
# Current value provides subtle padding while maintaining good visibility
VIDEO_SCALE_FACTOR=0.96

# Padding color for scaled video
# Can be specified as:
# - Named color: "black", "red", etc.
# - Hex value: "0x000000"
# - Hex with alpha: "0x000000FF" (FF = full opacity)
# - Transparent: "0x00000000" (00 = full transparency)
PADDING_COLOR="0x000000FF"  # Solid black with full opacity

# How many pixels to extend beyond the video edges for the bloom effect
# Lower values (10-20): Tighter glow that stays closer to video edges
# Higher values (40-100): Wider, more ethereal glow that extends further from video
# Current value creates a medium spread that doesn't interfere with other UI elements
BLOOM_PADDING=50

# Controls the spread/softness of the bloom effect
# Lower values (10-15): Sharper, more defined glow with less spread
# Higher values (25-50): Softer, more diffused glow that blends more
# Current value creates a soft, CRT-like glow while maintaining visibility
BLOOM_BLUR=20

# Multiplier for the bloom effect's brightness
# Lower values (0.5-0.9): Subtle, gentle glow
# Higher values (1.2-2.0): More intense, bright glow
# Values above 2.0 may cause oversaturation
# Current value adds noticeable glow while preserving video details
BLOOM_INTENSITY=1.2

# Overlay dimensions as percentage of background
OVERLAY_WIDTH_PERCENT=66.9  # This will make overlay ~515px wide on 768px background
OVERLAY_HEIGHT_PERCENT=65.3  # This will make overlay ~382px high on 576px background

# Calculate actual dimensions from percentages
OVERLAY_WIDTH=$(printf "%.0f" $(echo "$BG_WIDTH * $OVERLAY_WIDTH_PERCENT / 100" | bc -l))
OVERLAY_HEIGHT=$(printf "%.0f" $(echo "$BG_HEIGHT * $OVERLAY_HEIGHT_PERCENT / 100" | bc -l))

# Base overlay positions (center of the screen)
BASE_X=141
BASE_Y=100

# Calculate scaled dimensions
SCALED_WIDTH=$(printf "%.0f" $(echo "$OVERLAY_WIDTH * $VIDEO_SCALE_FACTOR" | bc -l))
SCALED_HEIGHT=$(printf "%.0f" $(echo "$OVERLAY_HEIGHT * $VIDEO_SCALE_FACTOR" | bc -l))

# Calculate padding for centered position within overlay area
SCALE_PADDING_X=$(printf "%.0f" $(echo "($OVERLAY_WIDTH - $SCALED_WIDTH) / 2" | bc -l))
SCALE_PADDING_Y=$(printf "%.0f" $(echo "($OVERLAY_HEIGHT - $SCALED_HEIGHT) / 2" | bc -l))


# Effect toggles
# Bloom effect settings
ENABLE_BLOOM=false  # Toggle for bloom effect on/off 


# Calculate initial overlay position
if [ "$ENABLE_BLOOM" = true ]; then
    # When bloom is enabled, we need extra padding for the glow
    PADDED_WIDTH=$((OVERLAY_WIDTH + 2*BLOOM_PADDING))
    PADDED_HEIGHT=$((OVERLAY_HEIGHT + 2*BLOOM_PADDING))
    
    # Adjust position to account for bloom padding
    OVERLAY_X=$((BASE_X - BLOOM_PADDING))
    OVERLAY_Y=$((BASE_Y - BLOOM_PADDING))
else
    # When bloom is disabled, use base dimensions
    PADDED_WIDTH=$OVERLAY_WIDTH
    PADDED_HEIGHT=$OVERLAY_HEIGHT
    
    # Use base position without bloom adjustment
    OVERLAY_X=$BASE_X
    OVERLAY_Y=$BASE_Y
fi

# Debug output
echo "Bloom enabled: ${ENABLE_BLOOM}"
echo "Original dimensions: ${OVERLAY_WIDTH}x${OVERLAY_HEIGHT}"
echo "Padded dimensions: ${PADDED_WIDTH}x${PADDED_HEIGHT}"
echo "Scaled dimensions: ${SCALED_WIDTH}x${SCALED_HEIGHT}"
echo "Scale padding: ${SCALE_PADDING_X}x${SCALE_PADDING_Y}"
echo "Base position: ${BASE_X}x${BASE_Y}"
echo "Final position: ${OVERLAY_X}x${OVERLAY_Y}"

# CRT effect settings
ENABLE_CRT=false  # Toggle for CRT effect
ENABLE_INTERLACED=false  # Toggle for interlaced effect
ENABLE_HIGHLIGHT=false  # Toggle for highlight effect


# CRT effect settings
# Barrel distortion coefficient for horizontal curvature
# Lower values (0.01): Subtle curve, almost flat screen look
# Higher values (0.05-0.1): Extreme curve, old TV appearance
# Current value creates gentle curve typical of 90s CRT monitors
CRT_K1=0.03

# Barrel distortion coefficient for vertical curvature
# Lower values (0.01): Minimal vertical curve
# Higher values (0.05-0.1): Strong fishbowl effect
# Usually kept equal to K1 for symmetrical distortion
CRT_K2=0.05

# Scale factor to compensate for image shrinkage due to curvature
# Values below 1.0: Image appears smaller than input
# Values above 1.0: Compensates for edge shrinkage
# Higher values (1.1-1.2): More compensation but may cut off edges
# Current value (1.05) provides 5% extra size to prevent black edges
CURVE_SCALE_FACTOR=1.05

# CRT interpolation method
# Options: nearest (sharp/pixelated), bilinear (smooth)
# bilinear smooths out stair-stepping on curved edges
CRT_INTERPOLATION="bilinear"

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
SCALE_FILTER="[1:v]scale=${SCALED_WIDTH}:${SCALED_HEIGHT}:force_original_aspect_ratio=decrease"
if [ "$PADDING_TYPE" = "pad" ]; then
    SCALE_FILTER="${SCALE_FILTER},pad=${OVERLAY_WIDTH}:${OVERLAY_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=${PADDING_COLOR}"
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
        
        if [ "$ENABLE_BLOOM" = true ]; then
            FILTER_CHAIN="${FILTER_CHAIN},\
                format=rgba,\
                pad=${PADDED_WIDTH}:${PADDED_HEIGHT}:${BLOOM_PADDING}:${BLOOM_PADDING}:color=0x00000000,\
                split [main][bloom];\
                [bloom]boxblur=${BLOOM_BLUR}[bloom];\
                [main][bloom]blend=all_mode=screen:shortest=1"
        fi
        
        FILTER_CHAIN="${FILTER_CHAIN},\
            format=rgba,\
            lenscorrection=k1=${CRT_K1}:k2=${CRT_K2}:i=${CRT_INTERPOLATION},\
            scale=iw*${CURVE_SCALE_FACTOR}:ih*${CURVE_SCALE_FACTOR}[scaled]"
    else
        FILTER_CHAIN="${SCALE_FILTER}"
        
        if [ "$ENABLE_HIGHLIGHT" = true ]; then
            FILTER_CHAIN="${FILTER_CHAIN},\
                ${HIGHLIGHT_FILTER}"
        fi
        
        if [ "$ENABLE_BLOOM" = true ]; then
            FILTER_CHAIN="${FILTER_CHAIN},\
                format=rgba,\
                pad=${PADDED_WIDTH}:${PADDED_HEIGHT}:${BLOOM_PADDING}:${BLOOM_PADDING}:color=0x00000000,\
                split [main][bloom];\
                [bloom]boxblur=${BLOOM_BLUR}[bloom];\
                [main][bloom]blend=all_mode=screen:shortest=1"
        fi
        
        FILTER_CHAIN="${FILTER_CHAIN},\
            format=rgba,\
            lenscorrection=k1=${CRT_K1}:k2=${CRT_K2}:i=${CRT_INTERPOLATION},\
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
        
        if [ "$ENABLE_BLOOM" = true ]; then
            FILTER_CHAIN="${FILTER_CHAIN},\
                format=rgba,\
                pad=${PADDED_WIDTH}:${PADDED_HEIGHT}:${BLOOM_PADDING}:${BLOOM_PADDING}:color=0x00000000,\
                split [main][bloom];\
                [bloom]boxblur=${BLOOM_BLUR}[bloom];\
                [main][bloom]blend=all_mode=screen:shortest=1"
        fi
        
        FILTER_CHAIN="${FILTER_CHAIN},\
            format=rgba[scaled]"
    else
        FILTER_CHAIN="${SCALE_FILTER}"
        
        if [ "$ENABLE_HIGHLIGHT" = true ]; then
            FILTER_CHAIN="${FILTER_CHAIN},\
                ${HIGHLIGHT_FILTER}"
        fi
        
        if [ "$ENABLE_BLOOM" = true ]; then
            FILTER_CHAIN="${FILTER_CHAIN},\
                format=rgba,\
                pad=${PADDED_WIDTH}:${PADDED_HEIGHT}:${BLOOM_PADDING}:${BLOOM_PADDING}:color=0x00000000,\
                split [main][bloom];\
                [bloom]boxblur=${BLOOM_BLUR}[bloom];\
                [main][bloom]blend=all_mode=screen:shortest=1"
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

