const socket = io("https://seat-socket.coupy.dev");

const controlLight = document.getElementById("controlLight");
const controlText = document.getElementById("controlText");
const explanation = document.getElementById("explanation");
const nameBox = document.getElementById("nameBox");
const overlay = document.getElementById("overlay");
const nextBtn = document.getElementById("next");
const nameRegex = /^[가-힣]{2,4}$/;

let display = 0;

const lightChange = (light, text) => {
  controlLight.className = light;
  controlText.textContent = text;
};

const loadingShow = () => {
  overlay.classList.add("show");
};

const loadingHide = () => {
  overlay.classList.remove("show");
};

socket.on("reload", () => {
  location.reload();
});

socket.on("connect", () => {
  lightChange("yellow", "연결중");
  socket.emit("student");
});

socket.on("connected-student", () => {
  lightChange("green", "연결됨");
  console.log("Connected as student");
});

socket.on("name-result", (result) => {
  loadingHide();
  if (result == true) {
    display = 1;
    nameBox.style.display = "none";
    nextBtn.style.display = "none";
    explanation.textContent = "잠시만 기다려주세요.";
  } else {
    alert("잘못된 학생 이름이거나 이미 접속한 상태입니다.");
  }
});

const next = () => {
  if (display == 0) {
    if (nameRegex.test(nameBox.value)) {
      loadingShow();
      socket.emit("name-submit", nameBox.value);
    } else {
      alert("이름을 올바르게 입력하세요.");
    }
  }
};
