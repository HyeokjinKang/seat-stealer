import config from "./config.js";

const socket = io("https://seat-socket.coupy.dev");
const controlLight = document.getElementById("controlLight");
const controlTitle = document.getElementById("controlTitle");
const controlExplanation = document.getElementById("controlExplanation");

let seats;
let studentCount = config.studentCount,
  students = config.students,
  display = 0,
  names = {};

const lightChange = (light) => {
  controlLight.className = light;
};

const statusUpdate = (display) => {
  if (display == 0) {
    const ids = Object.keys(names);
    controlTitle.textContent = `접속자: ${ids.length}/${studentCount}`;
    let text = "";
    for (let i = 0; i < ids.length; i++) {
      text += `${names[ids[i]]}${i + 1 == ids.length ? "" : ", "}`;
    }
    controlExplanation.textContent = text;
    if (ids.length == studentCount) lightChange("green");
    else lightChange("yellow");
  }
};

socket.on("reload", () => {
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

window.addEventListener("DOMContentLoaded", () => {
  seats = document.getElementsByClassName("seatContainer");
  for (let i = 1; i < seats.length; i++) {
    seats[i].textContent = i;
  }
});
