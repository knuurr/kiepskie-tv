# For local debug/experimenting

# Works, black padding, issue with contour of greenscreen visible
# ffmpeg -i ./cuts/1/greenscreen.png -i ./napierdala.webm -filter_complex "\
# [1:v]scale='min(iw,510):min((510/iw)*ih,382)':force_original_aspect_ratio=decrease,\
# pad=510:382:(ow-iw)/2:(oh-ih)/2[overlay];\
# [0:v][overlay]overlay=x=141:y=93" \
# -c:v libx264 -c:a copy -preset ultrafast temp_output.mp4


# ffmpeg -i ./cuts/1/greenscreen.png -i ./napierdala.webm -filter_complex "\
# [1:v]scale=w='min(iw,510)':h='min(ih,382)':force_original_aspect_ratio=decrease,\
# pad=510:382:((510-iw)/2)+2:((382-ih)/2)+1:color=black[overlay];\
# [0:v][overlay]overlay=x=142:y=94" \
# -c:v libx264 -c:a copy -preset ultrafast temp_output.mp4

# trick with pad to add +2

ffmpeg -i ./cuts/1/greenscreen.png -i ./napierdala.webm -filter_complex "\
[1:v]scale=w='min(iw,510)':h='min(ih,382)':force_original_aspect_ratio=decrease,\
pad=512:382:((512-iw)/2)+1:((382-ih)/2)+1:color=black[overlay];\
[0:v][overlay]overlay=x=140:y=94" \
-c:v libx264 -c:a copy -preset ultrafast temp_output.mp4


# ffmpeg -i 'temp_output.mp4' -i './cuts/1/video.mp4' -filter_complex "[1:v]scale=768:576 [scaledv]; [0:v][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" output.mp4

# Broken blur
# ffmpeg -i ./cuts/1/greenscreen.png -i ./cuts/1/cow.mp4 -filter_complex "\
# [1:v]scale=510:382:force_original_aspect_ratio=decrease[main];\
# [1:v]scale=1020:764,boxblur=10:10[bg];\
# [bg][main]overlay=(W-w)/2:(H-h)/2[overlay];\
# [0:v][overlay]overlay=x=141:y=93" \
# -c:v libx264 -c:a copy -preset ultrafast output.mp4
