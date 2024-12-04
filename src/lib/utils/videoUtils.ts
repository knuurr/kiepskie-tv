import type { FFmpeg } from "@ffmpeg/ffmpeg";

export async function getVideoDuration(file: File): Promise<number> {
  const video = document.createElement("video");
  const objectURL = URL.createObjectURL(file);

  video.src = objectURL;

  return new Promise((resolve, reject) => {
    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration;
      URL.revokeObjectURL(objectURL);
      video.remove();
      resolve(duration);
    });

    video.addEventListener("error", (error) => {
      URL.revokeObjectURL(objectURL);
      video.remove();
      reject(error);
    });
  });
}

export async function generatePreviews(file: File, ffmpeg: FFmpeg, duration: number): Promise<string[]> {
  console.log("[*] Generating previews for:", file.name);
  const previewTimes = [
    0, // Start
    Math.floor(duration / 2), // Middle
    Math.max(0, Math.floor(duration - 1)) // End (1 second before end to avoid black frames)
  ];

  const previews: string[] = [];

  try {
    for (const timeInSeconds of previewTimes) {
      // Write file only once
      if (timeInSeconds === 0) {
        await ffmpeg.writeFile(file.name, await fetchFile(file));
      }

      // Extract frame at specific timestamp
      await ffmpeg.exec([
        '-ss', timeInSeconds.toString(),
        '-i', file.name,
        '-vframes', '1',
        '-q:v', '2',
        '-f', 'image2',
        '-vf', 'scale=480:-1', // Reduce preview size
        `preview_${timeInSeconds}.jpg`
      ]);

      const previewData = await ffmpeg.readFile(`preview_${timeInSeconds}.jpg`);
      if (previewData instanceof Uint8Array) {
        const blob = new Blob([previewData], { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        previews.push(previewUrl);
      }

      // Cleanup preview file
      await ffmpeg.deleteFile(`preview_${timeInSeconds}.jpg`);
    }

    // Cleanup input file at the end
    await ffmpeg.deleteFile(file.name);
  } catch (error) {
    console.error("Error generating previews:", error);
    // Cleanup on error
    await ffmpeg.deleteFile(file.name);
    for (const timeInSeconds of previewTimes) {
      try {
        await ffmpeg.deleteFile(`preview_${timeInSeconds}.jpg`);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  return previews;
}

export async function generatePreviewAtTime(file: File, ffmpeg: FFmpeg, timeInSeconds: number): Promise<string> {
  try {
    await ffmpeg.writeFile(file.name, await fetchFile(file));

    await ffmpeg.exec([
      '-ss', timeInSeconds.toString(),
      '-i', file.name,
      '-vframes', '1',
      '-q:v', '2',
      '-f', 'image2',
      '-vf', 'scale=480:-1', // Reduce preview size
      'preview.jpg'
    ]);

    const previewData = await ffmpeg.readFile('preview.jpg');
    let previewUrl = '';

    if (previewData instanceof Uint8Array) {
      const blob = new Blob([previewData], { type: 'image/jpeg' });
      previewUrl = URL.createObjectURL(blob);
    }

    // Cleanup
    await ffmpeg.deleteFile('preview.jpg');
    await ffmpeg.deleteFile(file.name);

    return previewUrl;
  } catch (error) {
    console.error("Error generating preview:", error);
    // Cleanup on error
    try {
      await ffmpeg.deleteFile('preview.jpg');
      await ffmpeg.deleteFile(file.name);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

// Helper function for file reading
export const readFromBlobOrFile = (blob: Blob): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const { result } = fileReader;
      if (result instanceof ArrayBuffer) {
        resolve(new Uint8Array(result));
      } else {
        resolve(new Uint8Array());
      }
    };
    fileReader.onerror = (event) => {
      reject(
        Error(
          `File could not be read! Code=${event?.target?.error?.code || -1}`,
        ),
      );
    };
    fileReader.readAsArrayBuffer(blob);
  });

// Helper function for fetching files
export const fetchFile = async (file: string | URL | File | Blob): Promise<Uint8Array> => {
  let data;
  if (typeof file === "string") {
    if (/data:_data\/([a-zA-Z]*);base64,([^"]*)/.test(file)) {
      data = atob(file.split(",")[1])
        .split("")
        .map((c) => c.charCodeAt(0));
    } else {
      data = await (await fetch(file)).arrayBuffer();
    }
  } else if (file instanceof URL) {
    data = await (await fetch(file)).arrayBuffer();
  } else if (file instanceof File || file instanceof Blob) {
    data = await readFromBlobOrFile(file);
  } else {
    return new Uint8Array();
  }
  return new Uint8Array(data);
}; 