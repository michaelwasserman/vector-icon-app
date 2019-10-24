function paintIcons() {
  var input = document.getElementById("input");
  var preview_original = document.getElementById("preview-original");
  var preview_scaled = document.getElementById("preview-scaled");
  paintVectorIcon(input.value, preview_original, preview_scaled)
};

let fileHandle;

async function openFile(e) {
  var options = {
    type: "openFile",
    multiple: false,
    accepts: [{
      description: 'Vector icon file',
      extensions: ['icon'],
      mimeTypes: ['text/plain'],
    }],
  };
  fileHandle = await window.chooseFileSystemEntries();
  const file = await fileHandle.getFile();
  const contents = await file.text();
  var input = document.getElementById("input");
  input.value = contents;
  paintIcons();
}

async function saveFile(e) {
  if (!fileHandle) {
    const options = {
      type: 'saveFile',
      accepts: [{
        description: 'Vector icon file',
        extensions: ['icon'],
        mimeTypes: ['text/plain'],
      }],
    };
    fileHandle = await window.chooseFileSystemEntries(options);
  }
  if (!fileHandle)
    return;
  const writer = await fileHandle.createWriter();
  await writer.truncate(0);
  await writer.write(0, document.getElementById("input").value);
  await writer.close();
}

window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }

  // Show a title element when not run in a standalone PWA window.
  const isInStandaloneMode =
    (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');
  if (!isInStandaloneMode) {
    console.log("webapp is installed")
    var title = document.getElementById("title");
    title.hidden = false;
  }

  // Handle open/save button clicks and input events.
  document.getElementById("open").addEventListener('click', openFile);
  document.getElementById("save").addEventListener('click', saveFile);
  document.getElementById("input").addEventListener('input', paintIcons);

  // Catch "Ctrl/Meta + S" to save the icon file.
  document.addEventListener("keydown", function(e) {
    if (window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) {
      if (String.fromCharCode(event.keyCode).toLowerCase() == 's') {
        e.preventDefault();
        saveFile();
      } else if (String.fromCharCode(event.keyCode).toLowerCase() == 'o') {
        e.preventDefault();
        openFile();
      }
    }
  }, false);

  // Paint the initial icon content.
  paintIcons();
}