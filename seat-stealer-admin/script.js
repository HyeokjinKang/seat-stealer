const socket = io("https://seat-socket.coupy.dev");

const title = document.getElementById("title");
const random = document.getElementById("random");
const nextBtn = document.getElementById("nextBtn");
const controlLight = document.getElementById("controlLight");
const controlTitle = document.getElementById("controlTitle");
const controlExplanation = document.getElementById("controlExplanation");

const titleLoop = new Howl({
  src: ["./musics/title.mp3"],
  autoplay: false,
  loop: true,
  volume: 0.5,
});

const voteLoop = new Howl({
  src: ["./musics/vote-loop.mp3"],
  autoplay: false,
  loop: true,
  volume: 0.5,
});

const resultLoop = new Howl({
  src: ["./musics/result.mp3"],
  autoplay: false,
  loop: true,
  volume: 0.5,
});

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

const statusUpdate = (dnum) => {
  const ids = Object.keys(names);
  if (ids.length == studentCount) lightChange("green");
  else lightChange("yellow");

  let text = "";
  for (let i = 0; i < ids.length; i++) {
    let name = names[ids[i]];
    text += `<span class="names${voted.indexOf(name) != -1 ? " nameBlue" : ""}" onclick="delStudent(${i})">${names[ids[i]]}</span>${i + 1 == ids.length ? "" : ", "}`;
  }
  controlExplanation.innerHTML = text;

  if (dnum == 0) {
    controlTitle.textContent = `접속자: ${ids.length}/${studentCount}`;
  } else if (dnum == 1) {
    controlTitle.textContent = `접속자: ${ids.length}/${studentCount}, 투표참여: ${voted.length}/${studentCount}`;
  }
};

const delStudent = (n) => {
  const ids = Object.keys(names);
  socket.emit("removed", ids[n]);
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
  }, 20);
  if (num != remain.length - 1) {
    setTimeout(() => {
      resultShow(num + 1);
    }, 300);
  } else {
    for (let i = 0; i < filled.length; i++) {
      remain.splice(filled[i] - 1, 1);
    }
    filled = [];
    studentCount = remain.length;
    nextBtn.classList.remove("disabled");
    nextBtn.textContent = "진행 →";
    statusUpdate(0);
  }
};

const start = () => {
  titleLoop.play();
  document.getElementById("overlayContainer").style.display = "none";
};

const next = () => {
  if (display == 0) {
    display = 1;
    nextBtn.classList.add("disabled");
    nextBtn.textContent = "대기중 →";
    title.textContent = "원하는 자리에 투표해주세요.";
    socket.emit("seat-vote-start", config.studentCount);
    statusUpdate(display);
    titleLoop.fade(0.5, 0, 1000);
    setTimeout(() => {
      titleLoop.stop();
      voteLoop.play();
    }, 1000);
  } else if (display == 1) {
    voteLoop.fade(0.5, 0, 1000);
    display = 2;
    nextBtn.classList.add("disabled");
    nextBtn.textContent = "대기중 →";
    title.textContent = "1차 투표 결과";
    setTimeout(() => {
      voteLoop.stop();
      setTimeout(() => {
        resultLoop.play();
        setTimeout(() => {
          resultShow(0);
        }, 200);
      }, 2000);
    }, 1000);
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
