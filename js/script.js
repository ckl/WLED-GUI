document.getElementById("logo").addEventListener("click", openRepositorie);
// the imgClicked variable prevents the goToWled() function from beeing triggerd when clicking in a button
var imgClicked = false;
// set version
const version = "0.5.1";

// Light mode
if (localStorage.getItem("wledUiCfg") === null) {
    var ui = {
        "theme": {
            "base": "dark"
        }
    };
} else {
    var ui = JSON.parse(localStorage.getItem("wledUiCfg"));
    if (ui.theme.base == "light") {
        document.body.style.backgroundColor = "#eee";
        document.body.style.color = "black";
    }
}

// create json
if (localStorage.getItem("lights") === null) {
    console.log("No local storage item found. Creating one...");
    var lights = [];
    json = JSON.stringify(lights);
    localStorage.setItem("lights", json);
}

// Default PC Mode on
if (localStorage.getItem("pcm") === null) {
    localStorage.setItem("pcm", true);
}

// Opens Github page in default browser
function openRepositorie() {
    const { shell } = require('electron')
    shell.openExternal('https://github.com/Aircoookie/WLED')
}

// Opens the latest release of WLED-GUI in default browser
function openRelease() {
    const { shell } = require('electron')
    shell.openExternal('https://github.com/WoodyLetsCode/WLED-GUI/releases/latest')
}

// Shows all Lighs in main page
function showLights() {
    var lights = JSON.parse(localStorage.getItem("lights"));
    var txt = "";
    var oldTxt = document.getElementById("lights").innerHTML;
    for (let index = 0; index < lights.length; index++) {
        const element = lights[index];
        txt += "<div class=\"light\" onclick=\"goToWled(" + index + ")\" style=\"cursor: pointer;\">\n<br>\n";
        // Light mode
        if (ui.theme.base == "light") {
            txt += "<img src=\"images/icon_power.png\" id=\"img" + index + "\" class=\"darkicon ";
        }
        else {
            txt += "<img src=\"images/icon_power.png\" id=\"img" + index + "\" class=\"icon ";
        }
        if (element.on === true) {
            txt += "on";
        }
        txt += "\" onclick=\"toggleLight(" + index + ");\" height=\"75\">\n";
        txt += "<h5>" + element.name + "</h5>\n" + element.ip;
        if (element.online === false) {
            txt += " (Offline)\n";
        }
        txt += "<br><br></div><hr>";
    }
    if (txt !== oldTxt) {
        document.getElementById("lights").innerHTML = txt;
    }
}

// Shows all Lighs in delete page
function showLightsDel() {
    var lights = JSON.parse(localStorage.getItem("lights"));
    var txt = "";
    for (let index = 0; index < lights.length; index++) {
        const element = lights[index];
        txt += "<div class=\"light\">\n<br>\n";
        txt += "<img src=\"images/icon_delete.png\" onclick=\"del(" + index + ")\" class=\"icon del\" height=75>\n";
        txt += "<h5>" + element.name + "</h5>\n" + element.ip;
        if (element.online === false) {
            txt += " (Offline)\n";
        }
        txt += "<br><br></div><hr>";
    }
    document.getElementById("lights").innerHTML = txt;
}

// get the status of lights
// check if on or off and connection to them
function getStatus() {
    var lights = JSON.parse(localStorage.getItem("lights"));
    for (let index = 0; index < lights.length; index++) {
        const ip = lights[index].ip;

        let xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://' + ip + "/json", true);
        xhr.onload = function () {
            var json = JSON.parse(xhr.response);
            lights[index].online = true;
            lights[index].on = json.state.on;
            lights[index].version = json.info.ver;
            localStorage.setItem("lights", JSON.stringify(lights));
            showLights();
        };
        xhr.onerror = function () {
            lights[index].online = false;
            localStorage.setItem("lights", JSON.stringify(lights));
            showLights();
        }
        xhr.send();
    }
}

// opens the WLED page and set the correct ip address to localstorage
function goToWled(index) {
    // doesent trigger when a button is clicked
    if (imgClicked !== true) {
        var lights = JSON.parse(localStorage.getItem("lights"));
        var ip = lights[index].ip;
        var version = lights[index].version;
        localStorage.setItem("locIp", ip);
        localStorage.setItem("locVersion", version);
        location.href = "wled-viewer.html";
    }
}

// toggels the light
function toggleLight(index) {
    imgClicked = true;
    var lights = JSON.parse(localStorage.getItem("lights"));
    var ip = lights[index].ip;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://' + ip + "/win&T=2", true);
    xhr.onload = function () {
        imgClicked = false;
        getStatus();
    };
    xhr.send();
}

// adds a light and save it to localstorge
// gets data from json api
function addIP() {
    var ip = document.getElementById("ip").value;
    console.log(ip);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", 'http://' + ip + '/json/info', true);
    xhr.timeout = 2000; // time in milliseconds
    xhr.onload = function () { // Call a function when the state changes.
        var json = JSON.parse(xhr.response);
        var name = json.name;
        var light = { "name": name, "ip": ip, "online": true };
        var lights = JSON.parse(localStorage.getItem("lights"));
        console.log(lights);
        lights.push(light);
        json = JSON.stringify(lights);
        localStorage.setItem("lights", json);
        location.href = "index.html";
    }
    xhr.onerror = function () {
        M.toast({ html: 'Error! Can\'t connect to WLED.' });
    }
    xhr.send();
}

// deletes a light from localstorage
function del(index) {
    var lights = JSON.parse(localStorage.getItem("lights"));
    lights.splice(index, 1);
    localStorage.setItem("lights", JSON.stringify(lights));
    showLightsDel();
}

// checks if a update is available
function checkForUpdate() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://raw.githubusercontent.com/WoodyLetsCode/WLED-GUI/master/VERSION', true);
    xhr.onload = function () {
        console.log();
        if (xhr.response !== version && (localStorage.getItem("remindLaterTime") === null || (Date.now() - localStorage.getItem("remindLaterTime")) >= 259200000)) { // 3 days
            console.log("New update avaiable!");
            let instance = M.Modal.getInstance(document.getElementById("updatePopup"));
            document.getElementById("updatePopupText").innerText = "A new update for WLED-GUI is available.\n\nYour version: " + version + "\nLatest version: " + xhr.response;
            instance.open();
        }
    };

    xhr.send();
}

// set remind later time
function remindLater() {
    localStorage.setItem('remindLaterTime', Date.now());
}

function sync() {
    getStatus();
    setTimeout(sync, 1000);
}