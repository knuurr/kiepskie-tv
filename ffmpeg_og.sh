  # export function generateBoczekFilter(
  #   imageWidth: number,
  #   imageHeight: number,
  #   fillType: "stretch" | "blur-padding" | "black-padding" = "stretch",
  #   scale: number = 0.8,
  # ) {
  #   if (fillType === "stretch") {
  #     code ...
  #   } else {
  #     // Calculate scaled height based on scale parameter
  #     const scaledHeight = Math.round(imageHeight * scale);

  #     if (fillType === "blur-padding") {
  #      code ...
  #     } else {
  #       // Black padding - scale video and pad with black
  #       return `[0:v]scale=${imageWidth}:${imageHeight},setsar=1[mainv];[1:v]scale=${imageWidth}:${scaledHeight}:force_original_aspect_ratio=decrease,pad=${imageWidth}:${imageHeight}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[scaledv];[mainv][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]`;
  #     }
  #   }
  # }

# await ffmpeg.exec([
#       "-i",
#       selectedBackground.id + ".png",
#       "-i",
#       file.name,
#       "-filter_complex",
#       greenscreenFilter,
#       "-c:v",
#       "libx264",
#       "-c:a",
#       "copy",
#       "-preset",
#       "ultrafast",
#       `output${_i}.mp4`,
#     ]);



# {
#   "backgrounds": [
#     {
#       "id": "okil-1",
#       "name": "Klasyczny Okił",
#       "description": "Co więcej, to jest klasyczny Okił",
#       "imagePath": "/greenscreen.png",
#       "previewPath": "/greenscreen.png",
#       "overlayConfig": {
#         "imageWidth": 768,
#         "imageHeight": 576,
#         "maxWidth": 512,
#         "maxHeight": 382,
#         "padWidth": 512,
#         "padHeight": 382,
#         "offsetX": 140,
#         "offsetY": 94
#       }
#     },