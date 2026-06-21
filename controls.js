const gallery = document.getElementById("gallery");
const stay = document.getElementById("stay");
let currentFormula = 'mandelbrot';
const saveBtn = document.getElementById("save");
const info = document.getElementById("info");

let isMute = true;
let navOpen = true;

// for (let i = 0; i < locations.length; i++) {
//   gallery.innerHTML += `<option value=${i}>${locations[i].name}</option>`
// }
function rebuildGallery() {
  console.log("[rebuilding gallery]")
  gallery.innerHTML = '';
  locations
    .filter(loc => !loc.formula || loc.formula === currentFormula)
    .forEach((loc, i) => {
      console.log(loc.name)
      gallery.innerHTML += `<option value="${loc.name}">${loc.name}</option>`;
    });

  
}

function muteAudio() {
  const muteBtn = document.getElementById("muteBtn");
  if (isMute) {
    stay.play();
    isMute = false;
    muteBtn.innerHTML = 'Mute';
  } else {
    stay.pause();
    isMute = true;
    muteBtn.innerHTML = 'Unmute';

  }
}

function saveLocation() {
  const loc = getLocation();
  console.log(loc);
  const name = prompt("Location Name: ");
  loc.name = name;

  locations.push({ ...loc, formula: currentFormula });

  localStorage.setItem("locations", JSON.stringify(locations));

 rebuildGallery();
}

function toggleNav() {
  rebuildGallery();
  document.getElementById('panel').classList.toggle('hidden');
  //   document.getElementById('navBtn').classList.toggle('hidden');
}
// in controls.js
document.getElementById('panel').addEventListener('click', e => e.stopPropagation());
function toggleInfo() {
  document
    .getElementById("infoModal")
    .classList
    .toggle("show");
}
document.addEventListener("click", (e) => {

  const modal =
    document.getElementById("infoModal");

  if (
    e.target === modal
  ) {
    modal.classList.remove("show");
  }

});

rebuildGallery();