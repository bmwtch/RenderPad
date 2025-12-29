// --- Global filename ---
let currentFileName = "page.html";

// --- IndexedDB setup ---
let db;
function openDB() {
    let request = indexedDB.open("htmlRendDB", 1);
    request.onupgradeneeded = function (e) {
        db = e.target.result;
        if (!db.objectStoreNames.contains("codes")) {
            db.createObjectStore("codes");
        }
    };
    request.onsuccess = function (e) {
        db = e.target.result;
        setTimeout(loadSampleHtml, 250); // load after DB ready
    };
    request.onerror = function (e) {
        console.error("IndexedDB error:", e.target.errorCode);
    };
}

function saveCode(code) {
    if (!db) return;
    let tx = db.transaction("codes", "readwrite");
    let store = tx.objectStore("codes");
    store.put(code, "LastCode");
}

function loadCode(callback) {
    if (!db) return;
    let tx = db.transaction("codes", "readonly");
    let store = tx.objectStore("codes");
    let request = store.get("LastCode");
    request.onsuccess = function () {
        callback(request.result);
    };
}

// --- update logic ---
function update(i) {
    if (i === 0) {
        let text = document.getElementById("textarea1").value;
        saveCode(text); // save to IndexedDB
        loadCode(function (LastCode) {
            if (LastCode) {
                let iframe = document.getElementById('viewer').contentWindow.document;
                iframe.open();
                iframe.write(LastCode);
                iframe.close();
            }
        });
    } else if (i === 1) {
        let textarea1 = document.getElementById("textarea1").value;
        document.getElementById("textarea1").value = textarea1;
    }
}

// --- code highlighting ---
function updateCode() {
    const textarea1 = document.getElementById("textarea1");
    const codeBlock = document.getElementById("codeBlock");

    let content = textarea1.value;
    content = content.replace(/&/g, '&amp;');
    content = content.replace(/</g, '&lt;');
    content = content.replace(/>/g, '&gt;');

    codeBlock.innerHTML = content;
    highlightJS();
}

function highlightJS() {
    document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
    });
}

// --- auto save on edit ---
const textarea1 = document.getElementById("textarea1");
const codeBlock = document.getElementById("codeBlock");

textarea1.addEventListener("input", () => {
    updateCode();
    saveCode(textarea1.value); // auto save
});

textarea1.addEventListener("scroll", () => {
    codeBlock.scrollTop = textarea1.scrollTop;
    codeBlock.scrollLeft = textarea1.scrollLeft;
});

// --- style/theme/font controls ---
document.getElementById("selectStyle").addEventListener("change", (e) => {
    document.getElementById("theme1").href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/${e.target.value}`;
});

function updateFont() {
    let selectFont = document.getElementById("selectFont");
    let fontName = selectFont.options[selectFont.selectedIndex].text;
    let fontNameUrl = fontName.replace(" ", "+");
    let inputFontSize = document.getElementById("inputFontSize");

    // Ensure style2 exists
    let styleTag = document.getElementById("style2");
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "style2";
        document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=${fontNameUrl}&display=swap');
      pre, code, textarea {
          font-family: "${fontName}", monospace !important;
          font-size: ${inputFontSize.value}pt !important;
      }`;
}

document.getElementById("selectLanguage").addEventListener("change", function () {
    codeBlock.className = this.value;
    highlightJS();
});

document.getElementById("inputFontSize").addEventListener("input", () => { updateFont(); });
document.getElementById("selectFont").addEventListener("change", () => { updateFont(); });

// --- load sample HTML ---
function loadSampleHtml() {
    loadCode(function (LastCode) {
        if (LastCode) {
            textarea1.value = LastCode.trim();
            let iframe = document.getElementById('viewer').contentWindow.document;
            iframe.open();
            iframe.write(LastCode);
            iframe.close();
            updateCode();
        }
    });
}

// --- simplified render logic ---
function ShowContainer1() {
    loadCode(function (LastCode) {
        if (LastCode) {
            let newWindow = window.open("", "_blank");
            newWindow.document.open();
            newWindow.document.write(LastCode);
            newWindow.document.close();
        }
    });
}

// --- save as HTML logic ---
function ShowContainer4() {
    loadCode(function (LastCode) {
        if (LastCode) {
            const blob = new Blob([LastCode], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = currentFileName; // use renamed filename
            a.click();
            URL.revokeObjectURL(url);
        }
    });
}

// --- Rename filename logic ---
function renameFile() {
    const fileNameSpan = document.getElementById("fileName");
    const oldName = currentFileName;

    // Create input field
    const input = document.createElement("input");
    input.type = "text";
    input.value = oldName;
    input.className = "form-control text-center";
    input.style.maxWidth = "200px";

    fileNameSpan.replaceWith(input);
    input.focus();

    input.addEventListener("blur", () => {
        saveNewFileName(input.value);
    });
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            saveNewFileName(input.value);
        }
    });
}

function saveNewFileName(newName) {
    if (!newName.endsWith(".html")) {
        newName += ".html"; // enforce .html extension
    }
    currentFileName = newName;

    const span = document.createElement("span");
    span.id = "fileName";
    span.className = "mx-auto text-light";
    span.style.cursor = "pointer";
    span.ondblclick = renameFile;
    span.textContent = currentFileName;

    document.querySelector("input[type=text]").replaceWith(span);
}

// --- init DB on load ---
window.onload = function () {
    openDB();
};
