const fileInput = document.getElementById("fileInput");
const uploadStatus = document.getElementById("uploadStatus");
const fullWindow = document.querySelector(".full-window");
const urlSend = document.getElementById("urlSend");

document.addEventListener("paste", onFilePaste);
fullWindow.addEventListener("drop", onFileDrop);
fileInput.addEventListener("change", onFileChange);
urlSend.addEventListener("send", onFileUrlSend);

function onFileChange() {
  const file = fileInput.files[0];
  if (file) handleUpload(file);
}

function onFileDrop(event) {
  event.preventDefault();
  let files = event.dataTransfer.files;
  for (let i = 0; i < files.length; i++) {
    handleUpload(files[i]);
  }
}

function onFilePaste(event) {
  const items = (event.clipboardData || event.originalEvent.clipboardData)
      .items;
  for (let index in items) {
    const item = items[index];
    if (item.kind === "file") {
      const blob = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result.split(",")[1];
        const data = window.atob(base64Data);
        const ia = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
          ia[i] = data.charCodeAt(i);
        }
        const blob = new Blob([ia.buffer], {type: "image/jpeg"});
        const file = new File([blob], "screenshot.jpg");
        handleUpload(file);
      };
      reader.readAsDataURL(blob);
    }
  }
}

function onFileUrlCopy() {
  const imageUrl = document.getElementById("imageUrl");
  imageUrl.select();
  document.execCommand("copy");
  document.querySelector(".copy-btn").textContent = "已复制 ✨";
  setTimeout(() => {
    document.querySelector(".copy-btn").textContent = "复制图片or视频URL";
  }, 1000);
}

function onFileUrlSend() {
  const imageUrl = document.getElementById("imageUrl").value;
  const sendUrl = imageUrl.search("mp4") !== -1 ? `[视频](${imageUrl})` : `![screenshot](${imageUrl})`;
  // 创建一个包含消息信息的对象
  const messageData = {
    token: "",
    channel: "Image Ding Talk",
    title: "消息推送服务",
    description: "消息推送通道 Image Ding Talk 测试成功",
    content: `#### DiDa QA为您传图\n> 这是您上传的图片 or 视频\n> ${sendUrl}\n>`
  };
  console.log(messageData)

  fetch("/send", {
    method: "POST",
    body: JSON.stringify(messageData),
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  })
      .then(response => response.json())
      .then(data => {
        console.log('Image URL sent successfully:', data);
        // 修改按钮文本
        document.querySelector(".send-btn").textContent = "✨ 已发送";
        setTimeout(() => {
          document.querySelector(".send-btn").textContent = "发送图片URL";
        }, 1000);
      })
      .catch(error => {
        console.error('Failed to send image URL:', error);
        // 在失败的情况下同样修改按钮文本
        document.querySelector(".send-btn").textContent = "❌ 发送失败";
        setTimeout(() => {
          document.querySelector(".send-btn").textContent = "发送图片URL";
        }, 1000);
      });
}

function compressedFile(file) {
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  return new Promise((resolve) => {
    if (file.size <= maxFileSize || file.name.toLowerCase().endsWith(".gif")) {
      resolve(file);
    } else {
      imageCompression(file, {maxSizeMB: 5})
          .then((compressedFile) => {
            resolve(compressedFile);
          })
          .catch((error) => {
            console.error(">> imageCompression error", error);
            resolve(file);
          });
    }
  });
}

function handleUpload(file) {
  document.querySelector(".upload-text").textContent = "上传中...";
  document.querySelector(".spinner-grow").classList.remove("d-none");
  compressedFile(file).then((compressedFile) => {
    const formData = new FormData();
    formData.append("file", compressedFile);
    fetch("/upload", {method: "POST", body: formData})
        .then((response) => response.json())
        .then((data) => {
          if (data && data.error) {
            throw new Error(data.error);
          }
          const src = window.location.origin + data[0].src;
          uploadStatus.innerHTML = `
        <div class="alert alert-success text-center">上传成功 🥳</div>
        <div class="input-group">
          <input type="text" class="form-control" id="imageUrl" value="${src}">
          <div class="input-group-append">
            <button class="btn btn-outline-secondary copy-btn" type="button">复制图片or视频URL</button>
          </div>
          <div class="input-group-append">
            <button class="btn btn-outline-secondary send-btn" type="button">发送图片or视频URL</button>
          </div>
        </div>
        <img style="margin-top: 10px" src="${src}" class="img-fluid mb-3" alt="Uploaded Image">
        `;
          document
              .querySelector(".copy-btn")
              .addEventListener("click", onFileUrlCopy);
          document
              .querySelector(".send-btn")
              .addEventListener("click", onFileUrlSend);
        })
        .catch((error) => {
          uploadStatus.innerHTML = `
        <div class="alert alert-danger">${
              error || "上传失败. 请重试."
          }</div>
        `;
        })
        .finally(() => {
          document.querySelector(".upload-text").textContent = "重新上传";
          document.querySelector(".spinner-grow").classList.add("d-none");
        });
  });
}