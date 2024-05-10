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

# ffmpeg -i ./cuts/1/greenscreen.png -i ./napierdala.webm -filter_complex "\
# [1:v]scale=w='min(iw,510)':h='min(ih,382)':force_original_aspect_ratio=decrease,\
# pad=512:382:((512-iw)/2)+1:((382-ih)/2)+1:color=black[overlay];\
# [0:v][overlay]overlay=x=140:y=94" \
# -c:v libx264 -c:a copy -preset ultrafast temp_output.mp4


# ffmpeg -i 'temp_output.mp4' -i './cuts/1/video.mp4' -filter_complex "[1:v]scale=768:576 [scaledv]; [0:v][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" output.mp4

# Broken blur
# ffmpeg -i ./cuts/1/greenscreen.png -i ./cuts/1/cow.mp4 -filter_complex "\
# [1:v]scale=510:382:force_original_aspect_ratio=decrease[main];\
# [1:v]scale=1020:764,boxblur=10:10[bg];\
# [bg][main]overlay=(W-w)/2:(H-h)/2[overlay];\
# [0:v][overlay]overlay=x=141:y=93" \
# -c:v libx264 -c:a copy -preset ultrafast output.mp4


# Overlay intro audio file
# ffmpeg -i ./static/video.mp4 -i ./static/intro.mp3 -filter_complex "[0:a]volume=0.5[a];[1:a]adelay=1000|1000[a1];[a][a1]amix=inputs=2:duration=first:dropout_transition=2" -c:v copy -map 0:v:0 -map "[a]" output.mp4

# volume=0.5 reduces the volume of the input.mp3 audio file by 50%.
# amix=inputs=2:duration=first:dropout_transition=3 mixes the two audio streams (input.mp4 and input.mp3) with a fadeout of 3 seconds.
# -c:v copy copies the video stream without re-encoding.


# ffmpeg -i ./static/video.mp4 -i ./static/intro.mp3 -filter_complex "[1:0]volume=0.5[a];[0:0][a]amix=inputs=2:duration=first:dropout_transition=3" -c:v copy output.mp4

# ffmpeg -i ./static/video.mp4 -i ./static/intro.mp3 -filter_complex "[0:a]adelay=0|0[a];[1:a]atrim=duration=duration_of_mp3[a1];[a1]adelay=0|0[a2];[a][a2]amix=inputs=2" -c:v copy output.mp4
# adelay=0|0[a] ensures that the audio track of the mp4 file is not delayed.
# atrim=duration=duration_of_mp3[a1] trims the audio of the mp3 file to its duration.
# adelay=0|0[a2] ensures that the audio of the trimmed mp3 file is not delayed.
# [a][a2]amix=inputs=2 mixes the original audio track with the trimmed audio track.


# ffmpeg -i ./static/video.mp4 -i ./static/intro.mp3 -filter_complex "[1:a]adelay=0|0[a1];[0:a][a1]amix=inputs=2" -c:v copy output.mp4

# [1:a]adelay=0|0[a1] sets the audio delay for the mp3 file.
# [0:a][a1]amix=inputs=2 mixes the audio streams of the mp4 and mp3 files.


# AUDIO TRANSITION
# ffmpeg -i ./static/video.mp4 -i ./static/example.webm -i ./static/intro.mp3 -filter_complex "[2:a]adelay=n|n[a1];[0:a][a1]amix=inputs=2:duration=first:dropout_transition=1[outa]" -map 0:v -map [outa] -shortest output.mp4
# ffmpeg -i ./static/video.mp4 -i ./static/intro.mp3 -i ./static/example.webm -filter_complex "[0:v][1:a][2:v]concat=n=3:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" output.mp4

# ffmpeg -i ./static/video.mp4 -i ./static/intro.mp3 -i ./static/example.webm -filter_complex "[0:v][1:a][2:v]concat=n=3:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -shortest output.mp4

# ffmpeg -i ./static/video.mp4 -i ./static/intro.mp3 -filter_complex "[0:a]adelay=1000[a1];[1:a][a1]amix=inputs=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest output.mp4

# Somewhat works
# ffmpeg -i ./static/video.mp4 -i ./static/oooo.mp3 -filter_complex "[1:a]atrim=start=0:end=1[a];[0:a][a]amix=inputs=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac output.mp4

# 2nd attempt
# ffmpeg -i input_video.mp4 -i input_audio.mp3 -filter_complex "[1:a]atrim=start=0:end=(duration-2)[a];[0:a][a]amix=inputs=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac output_video.mp4

# ffmpeg -i ./static/video.mp4 -i ./static/oooo.mp3 -filter_complex "[1:a]adelay=7|7[a1];[0:a][a1]amix=inputs=2:duration=longest[out]" -map 0:v -map "[out]" output.mp4

# ffmpeg -i ./static/video.mp4 -itsoffset 1 -i ./static/oooo.mp3 -c:v copy -c:a aac output.mp4
# ffmpeg -i ./static/video.mp4 -itsoffset 10 -i ./static/oooo.mp3 -map 0:v -map 1:a -c:v copy -c:a aac output_video.mp4

