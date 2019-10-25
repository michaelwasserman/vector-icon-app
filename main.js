function paintIcons() {
  var input = document.getElementById("input");
  var previews = document.getElementsByClassName("preview");
  paintVectorIcon(input.value, previews);
};

let fileHandle_;

async function setIconContent(contents) {
  var input = document.getElementById("input");
  input.value = contents;
  paintIcons();
}

async function readFile(fileHandle) {
  if (!fileHandle)
    return;
  const file = await fileHandle.getFile();
  const contents = await file.text();
  return contents;
}

async function setFile(fileHandle) {
  fileHandle_ = fileHandle;
  var fileContent = await readFile(fileHandle_);
  setIconContent(fileContent);
}

function needsFlag() {
  if ('chooseFileSystemEntries' in window)
    return false;
  document.getElementById("enable-native-file-system").hidden = false;
  console.error("Please enable chrome://flags/#native-file-system-api");
  return true;
}

async function openFile(e) {
  if (needsFlag())
    return;

  var options = {
    type: "openFile",
    multiple: true,
    accepts: [{
      description: 'Vector icon file',
      extensions: ['icon'],
      mimeTypes: ['text/plain'],
    }],
  };
  fileHandles = await window.chooseFileSystemEntries(options);
  if (!fileHandles || fileHandles.length == 0)
    return;

  if (fileHandles.length == 1) {
    setFile(fileHandles[0]);
    return;
  }

  // TODO(msw): FileHandle persistence and transferability would help here.
  var urls = [];
  for (fileHandle of fileHandles) {
    var fileContent = await readFile(fileHandle);
    var encodedData = window.btoa(fileContent);
    urls.push("./?base64=" + encodedData);
  }
  openWindows(urls);
}

async function saveFile(e) {
  if (needsFlag())
    return;

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
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://');
  document.getElementById("title").hidden = isInStandaloneMode;
  window.addEventListener('appinstalled', function() {
    document.getElementById("title").hidden = true;
  });

  // File Handling API, please enable chrome://flags/#file-handling-api
  if ('launchParams' in window) {
    // TODO(msw): Handle multiple launchParams files?
    if (launchParams.files.length)
      setFile(launchParams.files[0]);
  } else if ('chooseFileSystemEntries' in window) {
    console.log("Please enable chrome://flags/#file-handling-api");
  } else {
    console.log("Please enable chrome://flags/#native-file-system-api");
  }

  var urlParams = new URLSearchParams(window.location.search);
  if (!fileHandle_ && urlParams.has("base64")) {
    var encodedData = urlParams.get("base64");
    var decodedData = window.atob(encodedData);
    setIconContent(decodedData);
  }

  // Handle open/save button clicks and input events.
  document.getElementById("open").addEventListener('click', openFile);
  document.getElementById("window").addEventListener('click', windowButton);
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