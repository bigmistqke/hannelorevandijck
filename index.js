// Toggle captions visibility
function toggleCaptions(button) {
  console.log(button.innerHTML);
  const captions = document.getElementsByClassName("caption");

  if (button.innerHTML === "show captions") {
    for (let i = 0; i < captions.length; i++) {
      captions[i].style.display = "inline-block";
    }
    button.innerHTML = "hide captions";
  } else {
    for (let i = 0; i < captions.length; i++) {
      captions[i].style.display = "none";
    }
    button.innerHTML = "show captions";
  }
}

// Handle paste events in the body
document.body.addEventListener("paste", function (event) {
  event.preventDefault();
  let content = "";

  if (event.clipboardData) {
    content = (event.originalEvent || event).clipboardData.getData(
      "text/plain",
    );
    document.execCommand("insertText", false, content);
  } else if (window.clipboardData) {
    content = window.clipboardData.getData("Text");
    document.selection.createRange().pasteHTML(content);
  }
});

let draggingImage;
let mousePosition = {};
let isDragging = false;
let loadingImages = {};

// Delete an image
function deleteImage() {
  console.log(imgDelete);
  document.getElementById("imgGUI").style.display = "none";
  draggingImage = false;
  const imageContainer = imgDelete.parentElement;
  const row = imageContainer.parentElement;

  if (row.children.length === 1) {
    console.log("delete all row");
    row.parentElement.parentElement.removeChild(row.parentElement);
  } else {
    console.log("delete only this image");
    imageContainer.parentElement.removeChild(imageContainer);
  }
}

let targetElement;
const addRowDefaultHeight = "20vh";

// Upload and send pictures
function sendPictures(files, callback) {
  document.getElementById("uploading").style.display = "inline-block";
  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    formData.append("fileToUpload[]", files[i]);
  }
  formData.append("uploadFolder", "img");

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "sendPictures.php");
  xhr.send(formData);

  xhr.upload.onprogress = function (event) {};

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      document.getElementById("uploading").style.display = "none";
      console.log(xhr.responseText);
      const uploadedFiles = JSON.parse(xhr.responseText);
      for (let i = 0; i < uploadedFiles.length; i++) {
        callback(uploadedFiles[i]);
      }
    }
  };
}

// Extract file name from path
function getBaseName(filePath) {
  let fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
  const extension = fileName.split(".")[1];

  if (fileName.split("_sameNameDifferentFile").length > 1) {
    fileName = fileName.split("_sameNameDifferentFile")[0] + "." + extension;
  }

  return fileName;
}

// Select the text of an element
function selectElementText(element, frameWindow) {
  frameWindow = frameWindow || window;
  const frameDocument = frameWindow.document;

  if (frameWindow.getSelection && frameDocument.createRange) {
    const selection = frameWindow.getSelection();
    const range = frameDocument.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (frameDocument.body.createTextRange) {
    const textRange = frameDocument.body.createTextRange();
    textRange.moveToElementText(element);
    textRange.select();
  }
}

// Create and insert an image element
function createImage(files, index, insertBeforeElement) {
  const fileReader = new FileReader();
  fileReader.readAsDataURL(files[index]);

  fileReader.onload = function () {
    const container = document.createElement("div");
    container.ondrop = function () {};

    const addRowDiv = document.createElement("div");
    addRowDiv.className = "addRow";

    const rowDiv = document.createElement("div");
    rowDiv.className = "row";

    const imageWrapper = document.createElement("div");
    const alignments = ["left", "right", "center", "centerLeft", "centerRight"];
    imageWrapper.className =
      alignments[Math.floor(Math.random() * alignments.length)] + " cell";

    container.appendChild(rowDiv);
    container.appendChild(addRowDiv);
    rowDiv.appendChild(imageWrapper);

    if (insertBeforeElement) {
      console.log(insertBeforeElement.parentElement);
      document
        .getElementById("archive")
        .insertBefore(container, insertBeforeElement.parentElement);
    } else {
      document.getElementById("archive").appendChild(container);
    }

    const imageElement = new Image();
    imageElement.src = fileReader.result;
    imageElement.id = document.getElementsByTagName("img").length - 1;

    imageElement.ondblclick = function (event) {
      showCaption(event, this);
    };

    imageWrapper.id =
      "imgAlign" + (document.getElementsByTagName("img").length - 1);

    const sanitizedFileName = files[index].name.replace(" ", "_");
    loadingImages[sanitizedFileName] = imageElement;

    const captionDiv = document.createElement("div");
    captionDiv.className = "caption";

    const captionText = document.createElement("a");
    captionText.innerHTML =
      "Walls, 2015, Kunsthaus NRW Kornelimünster (DE), photo: Carl Brunn";
    captionText.setAttribute("contenteditable", true);

    const openLink = document.createElement("a");
    openLink.className = "openImg";
    openLink.innerHTML = "+";
    openLink.href = "og/" + sanitizedFileName;
    openLink.target = "_blank";

    imageWrapper.appendChild(imageElement);
    captionDiv.appendChild(captionText);
    captionDiv.appendChild(openLink);
    imageWrapper.appendChild(captionDiv);

    imageElement.onload = function () {
      if (imageElement.width > imageElement.height) {
        imageElement.className = "landscape m";
      } else {
        imageElement.className = "portrait m";
      }
    };

    if (index < files.length - 1) {
      createImage(files, index + 1);
    } else {
      sendPictures(files, function (uploadedFile) {
        console.log(uploadedFile);
        console.log(loadingImages);
        const fileParts = uploadedFile.split("/");
        let originalSrc;

        if (fileParts.length === 1) {
          console.log("this should happen " + uploadedFile);
          originalSrc = "og/" + uploadedFile;
          uploadedFile = "img/" + uploadedFile;
        } else {
          originalSrc = "og/" + fileParts[fileParts.length - 1];
        }

        loadingImages[getBaseName(uploadedFile)].src = uploadedFile;
        loadingImages[
          getBaseName(uploadedFile)
        ].parentElement.getElementsByClassName("openImg")[0].href = originalSrc;
      });
    }
  };
}

// Controls for manipulating images
document.getElementById("grayscale").oninput = function () {
  draggingImage.style.filter = "grayscale(" + this.value / 100 + ")";
};

document.getElementById("size").oninput = function () {
  const classes = draggingImage.classList;
  draggingImage.className = classes[0] + " " + this.value;
  console.log(draggingImage);
};

document.getElementById("align").oninput = function () {
  console.log(draggingImage);
  draggingImage.parentElement.style.verticalAlign = this.value;
};

// Hide image GUI on scroll
document.getElementById("archive").onscroll = function () {
  document.getElementById("imgGUI").style.display = "none";
};

const archive = document.getElementById("archive");
let portalOpen = true;

// Initialize archive
function init() {
  const addRowElements = document.getElementsByClassName("addRow");
  const captions = document.getElementsByClassName("caption");

  for (let i = 0; i < captions.length; i++) {
    captions[i].style.display = "none";
    captions[i].children[0].setAttribute("contenteditable", false);
  }

  const diTriElements = document.getElementsByClassName("diTri");
  for (let i = 0; i < diTriElements.length; i++) {
    diTriElements[i].style.display = "none";
    diTriElements[i].children[0].setAttribute("contenteditable", false);
  }

  addRowElements[addRowElements.length - 1].style.height = "calc(50vh / 2)";

  const allImages = document.getElementsByTagName("img");
  for (let i = 0; i < allImages.length; i++) {
    allImages[i].onclick = function (event) {
      showCaption(event, allImages[i]);
    };
  }

  setTimeout(function () {
    for (let i = 0; i < blurIndex; i++) {
      unblur(i, false, function () {
        const images = document.getElementsByTagName("img");
        for (let t = minLoaded; t < images.length; t++) {
          images[t].src = images[t].getAttribute("data-src");
        }
      });
    }
  }, 0);
}

init();

let xlMax = 2;
let blurIndex = 4;
let minLoaded = 2;
let loadedImages = 0;

// Unblur images progressively
function unblur(index, continueUnblur, callback) {
  setTimeout(function () {
    const images = document.getElementsByTagName("img");

    if (images[index].hasAttribute("src")) {
      if (index < images.length - 2 && continueUnblur)
        unblur(++blurIndex, true);
    } else {
      let sizeClass;
      const image = new Image();
      const classes = images[index].classList;

      for (let i = 0; i < classes.length; i++) {
        if (["m", "s", "xs"].includes(classes[i])) sizeClass = "m";
        if (classes[i] === "l") sizeClass = "l";
        if (classes[i] === "xl") sizeClass = "xl";
      }

      if (window.innerWidth < 600) sizeClass = "m";

      const imageSrcParts = images[index].getAttribute("data-src").split("/");
      const d = sizeClass + "/" + imageSrcParts[imageSrcParts.length - 1];

      image.onload = function () {
        loadedImages++;
        console.log("Loaded " + d + " at index " + index);

        if (loadedImages === minLoaded) {
          document.getElementById("archive").style.display = "inline-block";
          document.getElementById("load").style.display = "none";
          document.getElementById("contact").style.display = "inline-block";
          callback();
        } else {
          document.getElementById("load").innerHTML =
            parseInt((100 / minLoaded) * loadedImages) + "%";
        }

        images[index].parentElement.classList.remove("blur");
        images[index].src = d;

        if (continueUnblur && index < images.length - 2) {
          unblur(++blurIndex, true);
        } else if (callback) {
          callback();
        }
      };

      image.src = d;
    }
  }, 0);
}

// Show or hide caption
function showCaption(event, imageElement) {
  const parentContainer =
    imageElement.parentElement.parentElement.parentElement;

  if (event.button === 0) {
    if (
      imageElement.getAttribute("data-diTri") === "true" &&
      window.innerWidth > 700
    ) {
      const diTriElement = parentContainer.getElementsByClassName("diTri")[0];
      if (diTriElement.style.display === "block") {
        diTriElement.style.display = "none";
      } else {
        diTriElement.style.display = "block";
        if (
          document.getElementById("archive").scrollTop <
          diTriElement.offsetTop -
            window.innerHeight +
            diTriElement.offsetHeight
        ) {
          document.getElementById("archive").scrollTop =
            diTriElement.offsetTop -
            window.innerHeight +
            diTriElement.offsetHeight;
        }
      }
    } else {
      const nextSibling = imageElement.nextSibling.nextSibling.nextSibling.nextSibling;
      if (nextSibling.style.display !== "inline-block") {
        nextSibling.style.display = "inline-block";
        if (
          document.getElementById("archive").scrollTop <
          nextSibling.offsetTop - window.innerHeight + nextSibling.offsetHeight
        ) {
          document.getElementById("archive").scrollTop =
            nextSibling.offsetTop -
            window.innerHeight +
            nextSibling.offsetHeight;
        }
      } else {
        nextSibling.style.display = "none";
      }
    }
  }
}

// AJAX helper
function ajax(data, url, callback) {
  console.log(data);
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200 && callback) {
      callback(xhr.responseText);
    }
  };
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.send(data);
}
