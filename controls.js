const gallery = document.getElementById("gallery");
const stay = document.getElementById("stay");

const saveBtn = document.getElementById("save");
const info = document.getElementById("info");

let isMute = false;
let navOpen = true;

for (let i = 0; i<locations.length; i++) {
    gallery.innerHTML += `<option value=${i}>${locations[i].name}</option>`
}


function muteAudio(){
    const muteBtn = document.getElementById("muteBtn");
    if(isMute){
        stay.play();
        isMute = false;
        muteBtn.innerHTML = 'Mute';
    } else {
        stay.pause();
        isMute = true;
        muteBtn.innerHTML = 'Unmute';

    }
}

function saveLocation(){
    const loc = getLocation();
    console.log(loc);
    const name = prompt("Location Name: ");
    loc.name = name;

    locations.push(loc);

    localStorage.setItem("locations", JSON.stringify(locations));
    
    gallery.innerHTML = '';
    for (let i = 0; i<locations.length; i++) {
    gallery.innerHTML += `<option value=${i}>${locations[i].name}</option>`
}
}

function toggleNav(){
    info.classList.toggle("open");
}