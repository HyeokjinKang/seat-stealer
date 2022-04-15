const socket = io("https://seat-socket.coupy.dev");

const title = document.getElementById("title");
const randomBtn = document.getElementById("random");
const nextBtn = document.getElementById("nextBtn");
const fightSeat = document.getElementById("fightSeat");
const fightStudent = document.getElementById("fightStudent");
const controlLight = document.getElementById("controlLight");
const controlTitle = document.getElementById("controlTitle");
const seatContainer = document.getElementById("seatContainer");
const fightContainer = document.getElementById("fightContainer");
const controlContainer = document.getElementById("controlContainer");
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
  seatVote = {},
  seatFight = [];
let remain = [];
let filled = [];
let attempt = 0;

const lightChange = (light) => {
  controlLight.className = light;
};

const statusUpdate = (dnum) => {
  const ids = Object.keys(names);
  let text = "";

  for (let i = 0; i < ids.length; i++) {
    let name = names[ids[i]];
    text += `<span class="names${voted.indexOf(name) != -1 ? " nameBlue" : ""}" onclick="delStudent(${i})">${names[ids[i]]}</span>${i + 1 == ids.length ? "" : ", "}`;
  }
  controlExplanation.innerHTML = text;

  if (dnum == 0) {
    controlTitle.textContent = `접속자: ${ids.length}/${studentCount}`;
  } else if (dnum == 1) {
    controlTitle.textContent = `접속자: ${ids.length}/${studentCount}, 투표참여: ${voted.length}/${ids.length}`;
  }

  if (ids.length <= 0) {
    lightChange("gray");
    controlTitle.textContent = "종료됨";
  } else if (ids.length == studentCount) {
    lightChange("green");
  } else {
    lightChange("yellow");
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
        socket.emit("seat-versus", seatVote[n], seatVote[n].length);
        seatFight.push(n);
        seats[n].textContent = `${seatVote[n].length}명`;
        seats[n].style.backgroundColor = "#FFE8E8";
      } else {
        socket.emit("seat-confirm", seatVote[n][0], n);
        studentCount--;
        filled.push(n);
        seats[n].textContent = names[seatVote[n][0]];
        seats[n].style.backgroundColor = "#fff";
      }
    } else {
      seats[n].style.backgroundColor = "#DEF3FF";
    }

    if (num != remain.length - 1) {
      setTimeout(() => {
        resultShow(num + 1);
      }, 250);
    } else {
      for (let i = 0; i < filled.length; i++) {
        remain.splice(remain.indexOf(filled[i]), 1);
      }
      filled = [];
      nextBtn.classList.remove("disabled");
      nextBtn.textContent = "진행 →";
      statusUpdate(0);
    }
  }, 20);
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
      voteLoop.volume(0.5);
      voteLoop.play();
    }, 1000);
  } else if (display == 1) {
    voteLoop.fade(0.5, 0, 1000);
    display = 2;
    attempt++;
    nextBtn.classList.add("disabled");
    nextBtn.textContent = "대기중 →";
    title.textContent = `${attempt}차 투표 결과`;
    setTimeout(() => {
      voteLoop.stop();
      setTimeout(() => {
        resultLoop.volume(0.5);
        resultLoop.play();
        resultShow(0);
      }, 1000);
    }, 1000);
  } else if (display == 2) {
    display = 3;
    if (seatFight.length) {
      nextBtn.classList.add("disabled");
      nextBtn.textContent = "대기중 →";
      title.textContent = "승부의 시간";
      fightNext();
    } else {
      voteLoop.fade(0.5, 0, 1000);
      setTimeout(() => {
        voteLoop.stop();
      }, 1000);
      next();
    }
  } else if (display == 3) {
    display = 4;
    nextBtn.classList.remove("disabled");
    if (remain.length) randomBtn.classList.remove("hidden");
    title.textContent = `${attempt}차 배치 결과`;
    nextBtn.textContent = "진행 →";
  } else if (display == 4) {
    resultLoop.fade(0.5, 0, 1000);
    setTimeout(() => {
      resultLoop.stop();
    }, 1000);
    if (remain.length) {
      randomBtn.classList.add("hidden");
      voted = [];
      seatVote = {};
      display = 0;
      next();
    } else {
      for (let i = 1; i <= config.studentCount; i++) {
        seats[i].style.backgroundColor = "#fff";
        seats[i].style.borderColor = "#000";
      }
      seatContainer.style.height = "75vh";
      controlContainer.style.marginTop = "15vh";
      title.textContent = "최종 결과";
    }
  }
};

const random = () => {
  randomBtn.classList.add("hidden");
  const ids = Object.keys(names);
  seatVote = {};
  for (let i = 0; i < remain.length; i++) {
    const target = Math.floor(Math.random() * ids.length);
    seatVote[remain[i]] = [ids[target]];
    ids.splice(target, 1);
  }
  resultShow(0);
};

const fightNext = () => {
  if (seatFight.length) {
    const target = seatFight[0];
    fightSeat.textContent = `${target}번 자리`;
    let text = "";
    for (let i = 0; i < seatVote[target].length; i++) {
      socket.emit("seat-fight", seatVote[target][i]);
      text += `<span class="fightName" onclick="winStudent(${i})">${names[seatVote[target][i]]}</span>${i + 1 == seatVote[target].length ? "" : ", "}`;
    }
    fightStudent.innerHTML = text;
    fightContainer.className = "show";
  } else {
    for (let i = 0; i < filled.length; i++) {
      remain.splice(remain.indexOf(filled[i]), 1);
    }
    if (remain.length == 1) {
      const keys = Object.keys(names);
      seats[remain[0]].textContent = names[keys[0]];
      socket.emit("seat-confirm", keys[0], remain[0]);
      remain = [];
    }
    filled = [];
    next();
  }
};

const winStudent = (n) => {
  fightContainer.classList.add("hide");
  const target = seatFight[0];
  seats[target].style.transitionDuration = "0s";
  seats[target].style.backgroundColor = "#000";
  seats[target].style.color = "#fff";
  setTimeout(() => {
    seats[target].style.transitionDuration = "1s";
    seats[target].style.backgroundColor = "#fff";
    seats[target].style.color = "#000";
    seats[target].style.borderColor = "#df3737";
    socket.emit("seat-confirm", seatVote[target][n], target);
    seats[target].textContent = names[seatVote[target][n]];
    filled.push(target);
    seatVote[target].splice(n, 1);
    socket.emit("seat-wait", seatVote[target]);
    studentCount--;
  }, 20);
  setTimeout(() => {
    statusUpdate(0);
    fightContainer.className = "";
    seatFight.splice(0, 1);
    setTimeout(() => {
      fightNext();
    }, 50);
  }, 500);
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
  const nameArr = Object.values(names);
  let result = false;
  if (students.indexOf(name) != -1 && nameArr.indexOf(name) == -1 && display == 0) {
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
  if (remain.indexOf(n) != -1) {
    if (seatVote[n]) {
      seatVote[n].push(id);
    } else {
      seatVote[n] = [id];
    }
    voted.push(names[id]);
    socket.emit("seat-voted", id);
    statusUpdate(display);
    if (voted.length == Object.keys(names).length) {
      nextBtn.classList.remove("disabled");
      nextBtn.textContent = "진행 →";
    }
  } else {
    socket.emit("seat-vote-failed", id);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  seats = document.getElementsByClassName("seatContainer");
  for (let i = 1; i <= config.studentCount; i++) {
    remain.push(i);
    seats[i].textContent = i;
  }
});
