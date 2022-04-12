const socket = io("https://seat-socket.coupy.dev");

const title = document.getElementById("title");
const random = document.getElementById("random");
const nextBtn = document.getElementById("nextBtn");
const controlLight = document.getElementById("controlLight");
const controlTitle = document.getElementById("controlTitle");
const controlExplanation = document.getElementById("controlExplanation");

let seats;
let studentCount = config.studentCount,
  students = config.students,
  display = 0,
  names = {};
let voted = [],
  seatVote = {};
let remain = [];
let filled = [];

const lightChange = (light) => {
  controlLight.className = light;
};

const statusUpdate = (display) => {
  const ids = Object.keys(names);
  if (ids.length == studentCount) lightChange("green");
  else lightChange("yellow");

  let text = "";
  for (let i = 0; i < ids.length; i++) {
    let name = names[ids[i]];
    text += `${voted.indexOf(name) != -1 ? "<span class='nameBlue'>" : ""}${names[ids[i]]}${i + 1 == ids.length ? "" : ", "}${voted.indexOf(name) != -1 ? "</span>" : ""}`;
  }
  controlExplanation.innerHTML = text;

  if (display == 0) {
    controlTitle.textContent = `접속자: ${ids.length}/${studentCount}`;
  } else if (display == 1) {
    controlTitle.textContent = `접속자: ${ids.length}/${studentCount}, 투표참여: ${voted.length}/${studentCount}`;
  }
};

const resultShow = (num) => {
  n = remain[num];
  seats[n].style.transitionDuration = "0s";
  seats[n].style.backgroundColor = "#000";
  seats[n].style.color = "#fff";
  setTimeout(() => {
    seats[n].style.transitionDuration = "1s";
    seats[n].style.color = "#000";
    if (seatVote[n]) {
      if (seatVote[n].length > 1) {
        for (let i = 0; i < seatVote[n].length; i++) {
          socket.emit("seat-versus", seatVote[n][i], seatVote[n].length);
        }
        seats[n].textContent = `${seatVote[n].length}명`;
        seats[n].style.backgroundColor = "#FFE8E8";
      } else {
        socket.emit("seat-confirm", seatVote[n][0]);
        studentCount--;
        filled.push(n);
        seats[n].textContent = names[seatVote[n][0]];
        seats[n].style.backgroundColor = "#fff";
      }
    } else {
      seats[n].style.backgroundColor = "#DEF3FF";
    }
  }, 10);
  if (num != remain.length - 1) {
    setTimeout(() => {
      resultShow(num + 1);
    }, 500);
  } else {
    nextBtn.classList.remove("disabled");
    nextBtn.textContent = "진행 →";
  }
};

const next = () => {
  if (display == 0) {
    display = 1;
    nextBtn.classList.add("disabled");
    nextBtn.textContent = "대기중 →";
    title.textContent = "원하는 자리에 투표해주세요.";
    socket.emit("seat-vote-start", config.studentCount);
    statusUpdate(display);
  } else if (display == 1) {
    display = 2;
    nextBtn.classList.add("disabled");
    nextBtn.textContent = "대기중 →";
    title.textContent = "1차 투표 결과";
    resultShow(0);
  }
};

socket.on("reload", () => {
  isForcedReload++;
  location.reload();
});

socket.on("connect", () => {
  socket.emit("admin");
});

socket.on("connected-admin", () => {
  lightChange("yellow");
  statusUpdate(display);
  console.log("Connected as admin");
});

socket.on("name-submit", (name, id) => {
  let result = false;
  if (students.indexOf(name) != -1 && !names[id]) {
    names[id] = name;
    result = true;
    statusUpdate(display);
  }
  socket.emit("name-result", name, result, id);
});

socket.on("name-remove", (id) => {
  delete names[id];
  statusUpdate(display);
});

socket.on("seat-vote", (n, id) => {
  if (seatVote[n]) {
    seatVote[n].push(id);
  } else {
    seatVote[n] = [id];
  }
  voted.push(names[id]);
  socket.emit("seat-voted", id);
  statusUpdate(display);
  if (voted.length == studentCount) {
    nextBtn.classList.remove("disabled");
    nextBtn.textContent = "진행 →";
  }
});

window.addEventListener("DOMContentLoaded", () => {
  seats = document.getElementsByClassName("seatContainer");
  for (let i = 1; i <= config.studentCount; i++) {
    remain.push(i);
    seats[i].textContent = i;
  }
});
