# Command for Raster Image Watermark

# Explanation:

#     -i input_video.mp4: Specifies the input video.
#     -i watermark.png: Specifies the watermark image.
#     -filter_complex: Defines a complex filter graph.
#         [1][0]scale2ref=w=oh*mdar:h=ih*0.1[wm][vid]: Scales the watermark to 10% of the video's height while maintaining its aspect ratio. oh*mdar scales the width of the watermark image to match the video’s aspect ratio.
#         [vid][wm]overlay=W-w-10:H-h-10: Overlays the watermark (wm) on the video (vid). W-w-10 and H-h-10 place the watermark 10 pixels from the bottom-right corner.
#     -c:a copy: Copies the audio without re-encoding.
#     output_video.mp4: Specifies the output video file.

# This process ensures that the watermark is correctly scaled and positioned in the bottom-right corner of the video. Adjust the 0.1 in h=ih*0.1 to change the relative height of the watermark. For example, 0.15 would make the watermark 15% of the video's height.

ffmpeg -i greenscreen.png -i watermark.png -filter_complex "[1][0]scale2ref=w=oh*mdar:h=ih*0.1[wm][vid];[vid][wm]overlay=W-w-10:10" -c:a copy greenscreen2.png


ffmpeg -i video.mp4 -i watermark.png -filter_complex "[1][0]scale2ref=w=oh*mdar:h=ih*0.1[wm][vid];[vid][wm]overlay=W-w-10:10" -c:a copy video2.mp4

