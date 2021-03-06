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
  volume: 1,
});

const voteLoop = new Howl({
  src: ["./musics/vote.mp3"],
  autoplay: false,
  loop: true,
  volume: 0,
});

const resultLoop = new Howl({
  src: ["./musics/result.mp3"],
  autoplay: false,
  loop: true,
  volume: 1,
});

const finalLoop = new Howl({
  src: ["./musics/final.mp3"],
  autoplay: false,
  loop: true,
  volume: 1,
});

let seats;
let studentCount = config.studentCount,
  students = config.students,
  display = 0,
  names = {},
  remainCount = 0;
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
  let nameArr = [];
  let allArr = [];
  let text = "";

  for (let i = 0; i < ids.length; i++) {
    if (names[ids[i]][1]) {
      nameArr.push(names[ids[i]][0]);
    }
    allArr.push(names[ids[i]][0]);
  }

  for (let i = 0; i < students.length; i++) {
    text += `<span class="names${dnum == 0 ? (nameArr.indexOf(students[i]) != -1 ? " nameBlue" : " nameRed") : voted.indexOf(students[i]) != -1 ? " nameBlue" : " nameRed"}"
              onclick="delStudent(${allArr.indexOf(students[i]) != -1 ? i : -1})">${students[i]}</span>${i + 1 == students.length ? "" : ", "}`;
  }
  controlExplanation.innerHTML = text;

  if (dnum == 0) {
    controlTitle.textContent = `?????????: ${remainCount}/${studentCount}`;
  } else if (dnum == 1) {
    controlTitle.textContent = `?????????: ${remainCount}/${studentCount}, ????????????: ${voted.length}/${remainCount}`;
    if (voted.length == remainCount) {
      nextBtn.classList.remove("disabled");
      nextBtn.textContent = "?????? ???";
    }
  }

  if (remainCount <= 0 && display != 0) {
    lightChange("gray");
    controlTitle.textContent = "?????????";
  } else if (remainCount == studentCount) {
    lightChange("green");
  } else {
    lightChange("yellow");
  }
};

const delStudent = (n) => {
  if (n != -1) {
    const ids = Object.keys(names);
    socket.emit("removed", ids[n]);
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
        socket.emit("seat-versus", seatVote[n], seatVote[n].length);
        seatFight.push(n);
        seats[n].textContent = `${seatVote[n].length}???`;
        seats[n].style.backgroundColor = "#FFE8E8";
      } else {
        socket.emit("seat-confirm", seatVote[n][0], n);
        students.splice(students.indexOf(names[seatVote[n][0]][0]), 1);
        studentCount--;
        filled.push(n);
        seats[n].textContent = names[seatVote[n][0]][0];
        seats[n].style.backgroundColor = "#fff";
      }
    } else {
      seats[n].style.backgroundColor = "#DEF3FF";
    }

    if (num != remain.length - 1) {
      setTimeout(() => {
        resultShow(num + 1);
      }, 100);
    } else {
      for (let i = 0; i < filled.length; i++) {
        remain.splice(remain.indexOf(filled[i]), 1);
      }
      filled = [];
      nextBtn.classList.remove("disabled");
      nextBtn.textContent = "?????? ???";
      statusUpdate(0);
    }
  }, 20);
};

const start = () => {
  titleLoop.play();
  voteLoop.play();
  document.getElementById("overlayContainer").style.display = "none";
};

const next = () => {
  if (display == 0) {
    display = 1;
    nextBtn.classList.add("disabled");
    for (let i = 1; i <= config.studentCount; i++) {
      seats[i].style.backgroundColor = "#fff";
      seats[i].style.borderColor = "#000";
    }
    nextBtn.textContent = "????????? ???";
    title.textContent = "????????? ????????? ??????????????????.";
    socket.emit("seat-vote-start", config.studentCount);
    statusUpdate(display);
    if (titleLoop.volume()) {
      titleLoop.fade(1, 0, 1000);
      voteLoop.fade(0, 1, 1000);
    } else {
      setTimeout(() => {
        voteLoop.fade(0, 1, 1000);
      }, 1000);
    }
  } else if (display == 1) {
    voteLoop.fade(1, 0, 1000);
    display = 2;
    attempt++;
    nextBtn.classList.add("disabled");
    nextBtn.textContent = "????????? ???";
    setTimeout(() => {
      resultLoop.play();
      resultLoop.fade(0, 1, 1000);
      title.textContent = `${attempt}??? ?????? ??????`;
      setTimeout(() => {
        resultShow(0);
      }, 1000);
    }, 1000);
  } else if (display == 2) {
    display = 3;
    if (seatFight.length) {
      nextBtn.classList.add("disabled");
      nextBtn.textContent = "????????? ???";
      title.textContent = "????????? ??????";
      fightNext();
    } else {
      next();
    }
  } else if (display == 3) {
    display = 4;
    nextBtn.classList.add("disabled");
    if (remain.length) randomBtn.classList.remove("hidden");
    title.textContent = `${attempt}??? ?????? ??????`;
    if (remainCount || remain.length == 0) {
      nextBtn.classList.remove("disabled");
    }
    nextBtn.textContent = "?????? ???";
  } else if (display == 4) {
    resultLoop.fade(0.5, 0, 1000);
    setTimeout(() => {
      resultLoop.stop();
    }, 1000);
    if (remainCount) {
      randomBtn.classList.add("hidden");
      voted = [];
      seatVote = {};
      display = 0;
      next();
    } else {
      finalLoop.play();
      finalLoop.fade(0, 1, 1000);
      for (let i = 1; i <= config.studentCount; i++) {
        seats[i].style.backgroundColor = "#fff";
        seats[i].style.borderColor = "#000";
      }
      seatContainer.style.height = "75vh";
      controlContainer.style.marginTop = "15vh";
      title.textContent = "?????? ??????";
    }
  }
};

const random = () => {
  const keys = Object.keys(names);
  for (let i = 0; i < keys.length; i++) {
    socket.emit("random", keys[i]);
  }
  randomBtn.classList.add("hidden");
  let ids = [];
  for (let i = 0; i < students.length; i++) {
    names[i] = [students[i], 1];
    ids[i] = i;
  }
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
    fightSeat.textContent = `${target}??? ??????`;
    let text = "";
    for (let i = 0; i < seatVote[target].length; i++) {
      socket.emit("seat-fight", seatVote[target][i]);
      text += `<span class="fightName" onclick="winStudent(${i})">${names[seatVote[target][i]][0]}</span>${i + 1 == seatVote[target].length ? "" : ", "}`;
    }
    fightStudent.innerHTML = text;
    fightContainer.className = "show";
  } else {
    for (let i = 0; i < filled.length; i++) {
      remain.splice(remain.indexOf(filled[i]), 1);
    }
    if (remain.length == 1) {
      const keys = Object.keys(names);
      seats[remain[0]].textContent = names[keys[0]][0];
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
    students.splice(students.indexOf(names[seatVote[target][n]][0]), 1);
    seats[target].textContent = names[seatVote[target][n]][0];
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

socket.on("connect", () => {
  socket.emit("admin");
});

socket.on("connected-admin", () => {
  lightChange("yellow");
  statusUpdate(display);
  console.log("Connected as admin");
});

socket.on("name-submit", (name, id) => {
  const nameRaw = Object.values(names);
  const seatArr = Object.keys(seatVote);
  let nameArr = [];
  for (let i = 0; i < nameRaw.length; i++) {
    nameArr[2 * i] = nameRaw[i][0];
    nameArr[2 * i + 1] = nameRaw[i][1];
  }
  const keyArr = Object.keys(names);
  let result = false;
  let nameIndex = nameArr.indexOf(name);
  if (students.indexOf(name) != -1 && (nameIndex == -1 || (nameIndex != -1 && nameArr[nameIndex + 1] == 0))) {
    if (nameIndex != -1) {
      let key = keyArr[nameIndex / 2];
      for (let i = 0; i < seatArr.length; i++) {
        for (let j = 0; j < seatVote[seatArr[i]].length; j++) {
          if (seatVote[seatArr[i]][j] == key) {
            seatVote[seatArr[i]][j] = id;
          }
        }
      }
      delete names[key];
    }
    names[id] = [name, 1];
    remainCount++;
    result = true;
    statusUpdate(display);
  }
  socket.emit("name-result", name, result, id);
});

socket.on("name-remove", (id) => {
  if (names[id]) {
    names[id][1] = 0;
    remainCount--;
  }
  statusUpdate(display);
});

socket.on("seat-vote", (n, id) => {
  if (remain.indexOf(n) != -1) {
    if (seatVote[n]) {
      seatVote[n].push(id);
    } else {
      seatVote[n] = [id];
    }
    voted.push(names[id][0]);
    socket.emit("seat-voted", id);
    statusUpdate(display);
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
