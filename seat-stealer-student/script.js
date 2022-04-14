const socket = io("https://seat-socket.coupy.dev");

const controlLight = document.getElementById("controlLight");
const controlText = document.getElementById("controlText");
const explanation = document.getElementById("explanation");
const nameBox = document.getElementById("nameBox");
const overlay = document.getElementById("overlay");
const numBox = document.getElementById("numBox");
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

socket.on("disconnect", () => {
  lightChange("gray", "종료됨");
});

socket.on("removed", () => {
  display = -1;
  nameBox.style.display = "none";
  nextBtn.style.display = "none";
  explanation.textContent = "관리자가 연결을 끊었습니다.";
  lightChange("gray", "종료됨");
  socket.close();
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
    alert("잘못된 학생 이름이거나 이미 접속한 상태입니다.\n이미 시작된 투표에도 참여가 불가능합니다.");
  }
});

socket.on("seat-vote-start", (num) => {
  display = 2;
  numBox.min = 1;
  numBox.max = num;
  nextBtn.textContent = "투표 →";
  numBox.style.display = "initial";
  nextBtn.style.display = "initial";
  explanation.textContent = "원하는 자리의 번호를 입력하세요.";
  numBox.value = "";
});

socket.on("seat-voted", () => {
  loadingHide();
  display = 3;
  numBox.style.display = "none";
  nextBtn.style.display = "none";
  explanation.innerHTML = `잠시만 기다려주세요.<br>내가 투표한 자리 - <b>${numBox.value}</b>`;
});

socket.on("seat-vote-failed", () => {
  loadingHide();
  alert("빈 자리를 입력하세요.");
});

socket.on("seat-confirm", () => {
  display = 4;
  explanation.innerHTML = `축하합니다!<br><b>${numBox.value}번 자리</b> 확정`;
  socket.close();
});

socket.on("seat-versus", (len) => {
  display = 4;
  explanation.innerHTML = `승부를 기다리고 있습니다<br>${numBox.value}번 자리 - <b>${len - 1}명</b>의 경쟁자`;
});

socket.on("seat-fight", () => {
  explanation.innerHTML = `승부의 시간!<br>자리에서 일어나서 가위바위보를 하세요.`;
});

socket.on("seat-wait", () => {
  explanation.innerHTML = "다음 투표를 기다리는 중..";
});

const next = () => {
  if (display == 0) {
    if (nameRegex.test(nameBox.value)) {
      loadingShow();
      socket.emit("name-submit", nameBox.value);
    } else {
      alert("이름을 올바르게 입력하세요.");
    }
  } else if (display == 2) {
    if (numBox.value != "") {
      loadingShow();
      socket.emit("seat-vote", Number(numBox.value));
    } else {
      alert("숫자를 입력하세요.");
    }
  }
};

const numCheck = () => {
  let min = Number(numBox.min);
  let max = Number(numBox.max);
  if (numBox.value > max) numBox.value = max;
  else if (numBox.value < min && numBox.value != "") numBox.value = min;
};
