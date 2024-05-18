// Array of toast messages
export const TOASTS_PATH = 'toasts.txt'
export const TOASTS = [
  'Toast 1',
  'Toast 2',
  'Toast 3',
  // Add more toast messages here
];




// Function to load and parse a .txt file
export function loadAndParseTxtFile(filePath) {
  return new Promise((resolve, reject) => {
    fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load the file');
        }
        return response.text();
      })
      .then(data => {
        // Split the text into an array of strings
        const parsedArray = data.split('\n').filter(line => line.trim() !== '');
        resolve(parsedArray);
      })
      .catch(error => {
        reject(error);

      });
  });
}