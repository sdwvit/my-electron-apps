export function createSearchHTML() {
  return (
    "data:text/html;charset=UTF-8," +
    encodeURIComponent(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; }
            input { width: 100%; padding: 10px; font-size: 16px; }
          </style>
        </head>
        <body>
          <input id="searchInput" type="text" placeholder="Type to search..." autofocus />
          <script>
            const { ipcRenderer } = require('electron');
            const input = document.getElementById('searchInput');
            input.addEventListener('input', () => {
              ipcRenderer.send('search-query', input.value);
            });
            window.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                ipcRenderer.send('close-search');
              }
            });
          </script>
        </body>
        </html>
      `)
  );
}
