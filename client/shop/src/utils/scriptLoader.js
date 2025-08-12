// FILE: src/utils/scriptLoader.js

/**
 * Dynamically loads an external script and returns a promise that resolves when the script is loaded.
 * It prevents reloading the same script multiple times.
 * @param {string} url The URL of the script to load.
 * @returns {Promise<void>}
 */
export function loadScript(url) {
  return new Promise((resolve, reject) => {
    // Check if the script is already on the page
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));

    document.head.appendChild(script);
  });
}