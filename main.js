function paintIcons() {
  var input = document.getElementById("input");
  var preview_original = document.getElementById("preview-original");
  var preview_scaled = document.getElementById("preview-scaled");
  paintVectorIcon(input.value, preview_original, preview_scaled)
};

let fileHandle;

async function readFile() {
  if (!fileHandle)
    return;
  const file = await fileHandle.getFile();
  const contents = await file.text();
  var input = document.getElementById("input");
  input.value = contents;
  paintIcons();
}

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
  readFile();
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

function updateTitle() {
  // Show a title element when not run in a standalone PWA window.
  const isInStandaloneMode =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://');
  if (!isInStandaloneMode)
    document.getElementById("title").hidden = false;
}

window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }

  // Show a title when not installed.
  // TODO(msw): Why isn't this called? 
  window.addEventListener('appinstalled', updateTitle);
  updateTitle();

  // TODO(msw): Users must enable about:flags #file-handling-api
  // TODO(msw): Setup file type association: manifest.json bad / NOTIMPLEMENTED?
  // https://github.com/WICG/file-handling/blob/master/explainer.md
  // https://cs.chromium.org/chromium/src/third_party/blink/renderer/modules/manifest/fuzzer_seed_corpus/manifest_file_handler_6.json
  // https://cs.chromium.org/chromium/src/chrome/browser/extensions/convert_web_app_unittest.cc?rcl=00c4237f25b51acc4dcab0f0e8038bad913b577a&l=414
  // https://cs.chromium.org/chromium/src/chrome/browser/web_applications/components/web_app_file_handler_registration_win.cc
  if ('launchParams' in window) {
    console.log("launchParams.files:" + launchParams.files.length);
    if (launchParams.files.length) {
      console.log("launchParamgs.files[0]:" + launchParams.files[0]);
      fileHandle = launchParams.files[0];
      readFile();
    }
  } else {
    console.log("Warning: expected 'launchParams' in window");
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