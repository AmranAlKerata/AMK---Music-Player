/////////////////////////////
// BASICS DOCUMENT INITS ///
///////////////////////////

// Get images to animate (colored bloc that goes over the images)
const imagesToAnimate = [ ...document.querySelectorAll(".not-animated") ];

// Get advanced controls
const controlButtons = [ ...document.querySelectorAll(".button-control") ];
const nextButton = controlButtons.find((item) =>
  item.classList.contains("skip-forward-button")
);
const previousButton = controlButtons.find((item) =>
  item.classList.contains("skip-backward-button")
);
const repeatButton = controlButtons.find((item) =>
  item.classList.contains("repeat-button")
);
const randomButton = controlButtons.find((item) =>
  item.classList.contains("random-button")
);
const volumeIcon = document.querySelector(".toggle-volume");

// Get player elements (images) and basics controls
const player = {};
player.$container = document.querySelector(".controls-player");
player.$imagesContainer = document.querySelector(".images-container");
player.$musicName = player.$container.querySelector(".title");
player.$artistName = player.$container.querySelector(".author-album");
player.$mainImage = player.$imagesContainer.querySelector(".main-image");
player.$audio = new Audio();
player.$play = player.$container.querySelector(".play-button");
player.$seekVolume = player.$container.querySelector(".seek-bar-volume");
player.$seekTime = player.$container.querySelector(".seek-bar-time");
player.$spanCurrentTime = player.$container.querySelector(".current-time");
player.$spanDuration = player.$container.querySelector(".duration");
player.$fillTime = player.$seekTime.querySelector(".fill-time");
player.$fillTimeDot = player.$seekTime.querySelector(".dot-seek-bar-time");
player.$fillVolume = player.$seekVolume.querySelector(".fill-volume");
player.$fillVolumeDot = player.$seekVolume.querySelector(
  ".dot-seek-bar-volume"
);

// Get width of seekbar and volume bar to calculate the lenght for the resize
let seekTimeWidth = player.$seekTime.offsetWidth;
let seekVolumeWidth = player.$seekVolume.offsetWidth;

// Get localStorage values
const localMusicPositionTime = localStorage.getItem("localMusicPositionTime");
const localMusicVolume = localStorage.getItem("localMusicVolume");
const localMusicNumber = localStorage.getItem("localMusicNumber");
let localMusicMode = localStorage.getItem("localMusicMode");
let localMusicRandom = localStorage.getItem("localMusicRandom");
let localIndexRandomMusic = localStorage.getItem("localIndexRandomMusic");

// Init some important variables
let randomMusicNumbersArray = [];
let playlistDatabase;
let musicNumber = 0;

// Fetching JSON player database and execute the first music loading based on localStorage values
async function getMusic() {
  let response = await fetch("./database/player_database.json");
  let data = await response.json();
  return data;
}

getMusic()
  .then((_data) => {
    playlistDatabase = _data;
    if (localIndexRandomMusic && localMusicRandom == "random") {
      randomButton.classList.replace("is-not-active", "is-active");
      randomMusicPlaylist();
      musicNumber = randomMusicNumbersArray[localIndexRandomMusic];
    } else if (localMusicRandom == "random" && !localIndexRandomMusic) {
      localIndexRandomMusic = 0;
      randomButton.classList.replace("is-not-active", "is-active");
      randomMusicPlaylist();
      musicNumber = randomMusicNumbersArray[localIndexRandomMusic];
    } else if (localMusicNumber) {
      musicNumber = localMusicNumber;
    } else {
      musicNumber = 0;
    }
    changeMusic();
  })
  .catch((error) => {
    console.log(error);
  });

// Resize seekbar and volume bar when resizing the window
window.addEventListener("resize", () => {
  for (const imageToAnimate of imagesToAnimate) {
    imageToAnimate.classList.add("loading");
  }
  seekTimeWidth = player.$seekTime.offsetWidth;
  seekVolumeWidth = player.$seekVolume.offsetWidth;
  simpleUpdateSeekBar();
  simpleUpdateVolume();
});

// Wait to load the document and execute functions for the current time and current volume based on localStorage values
window.addEventListener("load", () => {
  if (localMusicPositionTime > 0) {
    player.$audio.currentTime = localMusicPositionTime;
    simpleUpdateSeekBar();
  }
  if (localMusicVolume) {
    player.$audio.volume = localMusicVolume;
  } else {
    player.$audio.volume = 1;
  }
  simpleUpdateVolume();
  localMusicPlayMode();
});

//////////////////////////
// CONTROLS FUNCTIONS ///
////////////////////////

// Play next music for random playlist or non-random playlist
const nextMusicChanger = () => {
  // If random is activated, we use the random array and the random music index
  if (localMusicRandom == "random") {
    if (localIndexRandomMusic < randomMusicNumbersArray.length - 1) {
      localIndexRandomMusic++;
    } else {
      localIndexRandomMusic = 0;
    }
    musicNumber = randomMusicNumbersArray[localIndexRandomMusic];
    localStorage.setItem("localIndexRandomMusic", localIndexRandomMusic);
  } else {
    // Or we juste change the basic music index
    if (musicNumber == playlistDatabase.length - 1) {
      musicNumber = 0;
    } else {
      musicNumber++;
    }
  }
  // Then we call functions to change musics informations and path
  imagesChange("animated-next", 2000);
  changeMusic();
  localStorage.setItem("localMusicNumber", musicNumber);
  player.$audio.currentTime = 0;
  simpleUpdateSeekBar();
  player.$audio.play();
  player.$play.classList.replace("is-not-active", "is-active");
  document.querySelector("#play-pause").setAttribute("name", "pause");
};

// Call back the nextMusic function
nextButton.addEventListener("click", () => {
  nextMusicChanger();
});

// Play previous music for random playlist or non-random playlist
const previousMusicChanger = () => {
  // If currentTime is more than 5s, the function resets it and plays it
  if (player.$audio.currentTime > 5) {
    player.$audio.currentTime = 0;
    player.$audio.play();
    simpleUpdateSeekBar();
  } else if (localMusicRandom == "random") {
    // If random is activated, we use the random array and the random music index
    if (localIndexRandomMusic == 0) {
      localIndexRandomMusic = randomMusicNumbersArray.length - 1;
    } else {
      localIndexRandomMusic--;
    }
    // Then we call functions to change musics informations and path
    musicNumber = randomMusicNumbersArray[localIndexRandomMusic];
    localStorage.setItem("localIndexRandomMusic", localIndexRandomMusic);
    imagesChange("animated-previous", 2000);
    changeMusic();
  } else {
    // Or we juste change the basic music index
    if (musicNumber == 0) {
      musicNumber = playlistDatabase.length - 1;
    } else {
      musicNumber--;
    }
    // Then we call functions to change musics informations and path
    imagesChange("animated-previous", 2000);
    changeMusic();
    player.$audio.play();
    player.$play.classList.replace("is-not-active", "is-active");
    document.querySelector("#play-pause").setAttribute("name", "pause");
  }
  localStorage.setItem("localMusicNumber", musicNumber);
};

// Call back the previousMusic function
previousButton.addEventListener("click", () => {
  previousMusicChanger();
});

// Play or pause the music based on button class
const playMusic = () => {
  if (player.$play.classList.contains("is-not-active")) {
    // Changing page's title with music's information
    document.title = `${playlistDatabase[musicNumber]
      .musicName} - ${playlistDatabase[musicNumber].artist}`;
    player.$audio.play().then((_) => {}).catch((error) => {
      console.log(error);
    });
    player.$play.classList.replace("is-not-active", "is-active");
    document.querySelector("#play-pause").setAttribute("name", "pause");
  } else {
    player.$audio.pause();
    player.$play.classList.replace("is-active", "is-not-active");
    document.querySelector("#play-pause").setAttribute("name", "play");
    // Resets the page's title
    document.title = "AMK - Music Player";
  }
};

// Call back the playMusic function
player.$play.addEventListener("click", () => {
  playMusic();
});

// Change images class to trigger CSS animation
const imagesChange = (classToChange, animationTimeUser) => {
  for (const imageToAnimate of imagesToAnimate) {
    if (imageToAnimate.classList.contains("loading")) {
      imageToAnimate.classList.remove("loading");
    }
    imageToAnimate.classList.replace("not-animated", classToChange);
    setTimeout(() => {
      imageToAnimate.classList.replace(classToChange, "not-animated");
    }, animationTimeUser);
  }
};

// Function to change the music
const changeMusic = () => {
  player.$audio.pause();
  if (musicNumber > playlistDatabase.length - 1) {
    musicNumber = 0;
  }
  // Call the CSS Animation trigger to change music artist and music name
  musicInformationChanger();
  setTimeout(() => {
    player.$musicName.textContent = playlistDatabase[musicNumber].musicName;
    player.$artistName.textContent = playlistDatabase[musicNumber].artist;
  }, 500);

  // Change sources of the audio and player elements
  player.$audio.src = playlistDatabase[musicNumber].audioSrc;

  // Wait to load metadata and then display current time and time
  player.$audio.addEventListener("loadedmetadata", () => {
    player.$spanCurrentTime.textContent = `${Math.floor(
      player.$audio.currentTime / 60
    )}:${leadingZeroTime(player.$audio.currentTime % 60)}`;
    player.$spanDuration.textContent = `${Math.floor(
      player.$audio.duration / 60
    )}:${leadingZeroTime(player.$audio.duration % 60)}`;
    if (!player.$audio.paused) {
      document.title = `${playlistDatabase[musicNumber]
        .musicName} - ${playlistDatabase[musicNumber].artist}`;
    }
  });

  // Synchronize changes and CSS Animation
  setTimeout(() => {
    player.$mainImage.style.backgroundImage = `url("${playlistDatabase[
      musicNumber
    ].backgroundImage}")`;
  }, 1000);

  // Store locally the music number
  localStorage.setItem("localMusicNumber", musicNumber);
};

// Function to trigger CSS Animation when changing music name and artist
const musicInformationChanger = () => {
  player.$artistName.classList.replace(
    "animated-music-information",
    "not-animated-music-information"
  );
  player.$musicName.classList.replace(
    "animated-music-information",
    "not-animated-music-information"
  );
  setTimeout(() => {
    player.$artistName.classList.replace(
      "not-animated-music-information",
      "animated-music-information"
    );
    player.$musicName.classList.replace(
      "not-animated-music-information",
      "animated-music-information"
    );
  }, 500);
};

// Function to add Leading zeros for the current time and time
const leadingZeroTime = (time) => {
  var result;
  // if time is less than 10s, then add a leading zero
  if (time < 10) {
    result = `0${Math.floor(time)}`;
  } else {
    result = Math.floor(time);
  }
  return result;
};

/////////////////////////////////
// METHODS TO UPDATE SEEKBAR ///
///////////////////////////////

// Function to update smoothly the seekbar when playing, for each frame
const loopSeekBarTime = () => {
  window.requestAnimationFrame(loopSeekBarTime);
  // If the music is played, then the function updates the seekbar
  if (!player.$audio.paused) {
    const scale = player.$audio.currentTime / player.$audio.duration;
    const translateDotTime =
      player.$audio.currentTime / player.$audio.duration * seekTimeWidth;
    player.$fillTime.style.transform = `scaleX(${scale})`;
    player.$fillTimeDot.style.transform = `translateX(${translateDotTime}px)`;
    player.$spanCurrentTime.textContent = `${Math.floor(
      player.$audio.currentTime / 60
    )}:${leadingZeroTime(player.$audio.currentTime % 60)}`;
    localStorage.setItem("localMusicPositionTime", player.$audio.currentTime);
  }
  if (
    player.$audio.currentTime == player.$audio.duration &&
    localMusicMode == "no-loop"
  ) {
    player.$play.classList.replace("is-active", "is-not-active");
    player.$audio.pause();
  }
};
loopSeekBarTime();

// Update seekbar for drag or click
const updateSeekBar = (_event) => {
  if (
    _event.type == "touchmove" ||
    _event.type == "touchstart" ||
    _event.type == "touchend"
  ) {
    var mouseX = _event.changedTouches[0].clientX;
  } else {
    var mouseX = _event.clientX;
  }
  const bounding = player.$seekTime.getBoundingClientRect();
  const ratio = (mouseX - bounding.left) / bounding.width;
  const time = ratio * player.$audio.duration;
  player.$audio.currentTime = time;
  if (player.$play.classList.contains("is-active")) {
    player.$audio.play();
  } else {
    const scale = player.$audio.currentTime / player.$audio.duration;
    const translateDotTime = scale * seekTimeWidth;
    player.$fillTime.style.transform = `scaleX(${scale})`;
    player.$fillTimeDot.style.transform = `translateX(${translateDotTime}px)`;
  }
  localStorage.setItem("localMusicPositionTime", player.$audio.currentTime);
  player.$spanCurrentTime.textContent = `${Math.floor(
    player.$audio.currentTime / 60
  )}:${leadingZeroTime(player.$audio.currentTime % 60)}`;
};

// Update seekbar once only
const simpleUpdateSeekBar = () => {
  const scale = player.$audio.currentTime / player.$audio.duration;
  const translateDotTime =
    player.$audio.currentTime / player.$audio.duration * seekTimeWidth;
  player.$fillTime.style.transform = `scaleX(${scale})`;
  player.$fillTimeDot.style.transform = `translateX(${translateDotTime}px)`;
};

//////////////////////////////////
// DRAG AND DROP SEEK-BAR-TIME //
////////////////////////////////

// Function for holding and dragging seekbar dot (desktops and mobiles)
const holdAndDragTime = (_event) => {
  _event.preventDefault();
  document.addEventListener("mousemove", updateSeekBar);
  document.addEventListener("mouseup", () => {
    if (player.$play.classList.contains("is-active")) {
      player.$audio.play();
    }
    document.removeEventListener("mousemove", updateSeekBar);
  });
};
const holdAndDragTimeMobile = (_event) => {
  _event.preventDefault();
  document.addEventListener("touchmove", updateSeekBar);
  document.addEventListener("touchend", () => {
    if (player.$play.classList.contains("is-active")) {
      player.$audio.play();
    }
    document.removeEventListener("touchmove", updateSeekBar);
  });
};

// Call Seekbar updater when clicking on the seekbar (desktops and mobiles)
player.$seekTime.addEventListener("mousedown", (_event) => {
  player.$audio.pause();
  updateSeekBar(_event);
  holdAndDragTime(_event);
});
player.$seekTime.addEventListener("touchstart", (_event) => {
  player.$audio.pause();
  updateSeekBar(_event);
  holdAndDragTimeMobile(_event);
});

// Call Seekbar updater when dragging the seekbar dot(desktops and mobiles)
player.$fillTimeDot.addEventListener("mousedown", (_event) => {
  holdAndDragTime(_event);
});
player.$fillTimeDot.addEventListener("touchstart", (_event) => {
  holdAndDragTimeMobile(_event);
});

////////////////////////////////
// METHODS TO UPDATE VOLUME ///
//////////////////////////////

// Function to change the icon volume based on the volume level
const volumeIconChanger = (volume) => {
  if (volume <= 0) {
    volumeIcon.setAttribute("id", "is-not-active");
    document.querySelector("#volume").setAttribute("name", "volume-mute");
  } else if (volume > 0 && volume < 0.33) {
    volumeIcon.setAttribute("id", "low-volume");
    document.querySelector("#volume").setAttribute("name", "volume-low");
  } else if (volume > 0.33 && volume < 0.66) {
    volumeIcon.setAttribute("id", "middle-volume");
    document.querySelector("#volume").setAttribute("name", "volume-medium");
  } else if (volume > 0.66 && volume <= 1) {
    volumeIcon.setAttribute("id", "high-volume");
    document.querySelector("#volume").setAttribute("name", "volume-high");
  }
};

// Update volume for drag or click
const updateVolumeBar = (_event) => {
  if (
    _event.type == "touchmove" ||
    _event.type == "touchstart" ||
    _event.type == "touchend"
  ) {
    var mouseX = _event.changedTouches[0].clientX;
  } else {
    var mouseX = _event.clientX;
  }
  const bounding = player.$seekVolume.getBoundingClientRect();
  const volume = (mouseX - bounding.left) / bounding.width;
  if (volume >= 0 && volume <= 1) {
    player.$audio.volume = volume;
  } else if (volume >= 1) {
    player.$audio.volume = 1;
  } else if (volume < 0) {
    player.$audio.volume = 0;
  }
  volumeIconChanger(volume);
  const scale = player.$audio.volume;
  const translateDotVolume = player.$audio.volume * seekVolumeWidth;
  player.$fillVolume.style.transform = `scaleX(${scale})`;
  player.$fillVolumeDot.style.transform = `translateX(${translateDotVolume}px)`;
  localStorage.setItem("localMusicVolume", player.$audio.volume);
};

// Update volume once only

const simpleUpdateVolume = () => {
  volumeIconChanger(player.$audio.volume);
  const scale = player.$audio.volume;
  const translateDotVolume = player.$audio.volume * seekVolumeWidth;
  player.$fillVolume.style.transform = `scaleX(${scale})`;
  player.$fillVolumeDot.style.transform = `translateX(${translateDotVolume}px)`;
};

////////////////////////////////////
// DRAG AND DROP SEEK-BAR-VOLUME //
//////////////////////////////////

// Function for holding and dragging volume bar dot (desktops and mobiles)
const holdAndDragVolume = (_event) => {
  _event.preventDefault();
  document.addEventListener("mousemove", updateVolumeBar);
  document.addEventListener("mouseup", () => {
    document.removeEventListener("mousemove", updateVolumeBar);
  });
};
const holdAndDragVolumeMobile = (_event) => {
  _event.preventDefault();
  document.addEventListener("touchmove", updateVolumeBar);
  document.addEventListener("touchend", () => {
    document.removeEventListener("touchmove", updateVolumeBar);
  });
};

// Call volume bar updater when clicking on the volume bar
player.$seekVolume.addEventListener("mousedown", (_event) => {
  updateVolumeBar(_event);
  holdAndDragVolume(_event);
});
player.$seekVolume.addEventListener("touchstart", (_event) => {
  updateVolumeBar(_event);
  holdAndDragVolumeMobile(_event);
});

// Call volume bar updater when clicking on the volume bar dot
player.$fillVolumeDot.addEventListener("mousedown", (_event) => {
  holdAndDragVolume(_event);
});
player.$fillVolumeDot.addEventListener("touchstart", (_event) => {
  holdAndDragVolumeMobile(_event);
});

// Function to save and restore the volume when mutting it
let tempVolume;
volumeIcon.addEventListener("click", () => {
  if (player.$audio.volume > 0) {
    tempVolume = player.$audio.volume;
    player.$audio.volume = 0;
  } else {
    player.$audio.volume = tempVolume;
  }
  simpleUpdateVolume();
});

//////////////////////////////////////
// MUSIC PLAY MODE AND RANDOM MODE //
////////////////////////////////////

// function to setup the Music Play Mode based on localStorage when loading the page
const localMusicPlayMode = () => {
  if (!localMusicMode) {
    localMusicMode = "no-loop";
  } else if (localMusicMode == "playlist-loop") {
    repeatButton.classList.replace("is-not-active", "playlist-loop");
  } else if (localMusicMode == "music-loop") {
    repeatButton.classList.replace("is-not-active", "music-loop");
  }
};

// Function to setup the Music Play Mode when clicking on the repeat button
const musicPlayMode = () => {
  if (repeatButton.classList.contains("is-not-active")) {
    repeatButton.classList.replace("is-not-active", "playlist-loop");
    localMusicMode = "playlist-loop";
    localStorage.setItem("localMusicMode", localMusicMode);
  } else if (repeatButton.classList.contains("playlist-loop")) {
    repeatButton.classList.replace("playlist-loop", "music-loop");
    localMusicMode = "music-loop";
    localStorage.setItem("localMusicMode", localMusicMode);
  } else {
    repeatButton.classList.replace("music-loop", "is-not-active");
    localMusicMode = "no-loop";
    localStorage.setItem("localMusicMode", localMusicMode);
  }
};

// Call back the function to setup the Music Play Mode
repeatButton.addEventListener("click", () => {
  musicPlayMode();
});

// Function to setup the random playlist if not setting up in localStorage, or to creates it
const randomMusicPlaylist = () => {
  let localMusicNumbersArray = localStorage.getItem("localMusicNumbersArray");
  if (localMusicNumbersArray) {
    randomMusicNumbersArray = JSON.parse(localMusicNumbersArray);
  } else {
    localIndexRandomMusic = 0;
    if (randomMusicNumbersArray.length == 0 || !randomMusicNumbersArray) {
      for (playlistDatabaseElement of playlistDatabase) {
        let randomNumber = Math.floor(
          Math.random() * Math.floor(playlistDatabase.length)
        );
        while (randomMusicNumbersArray.indexOf(randomNumber) != -1) {
          randomNumber = Math.floor(
            Math.random() * Math.floor(playlistDatabase.length)
          );
        }
        randomMusicNumbersArray.push(randomNumber);
      }
      localStorage.setItem(
        "localMusicNumbersArray",
        JSON.stringify(randomMusicNumbersArray)
      );
    }
  }
};

// Call back the random Playlist function based on the localStorage and if it is already activated, when clicking on the random button
randomButton.addEventListener("click", () => {
  if (randomButton.classList.contains("is-not-active")) {
    randomButton.classList.replace("is-not-active", "is-active");
    localMusicRandom = "random";
    randomMusicPlaylist();
  } else if (randomButton.classList.contains("is-active")) {
    randomButton.classList.replace("is-active", "is-not-active");
    localMusicRandom = "no-random";
    localStorage.removeItem("localMusicNumbersArray");
    localStorage.removeItem("localIndexRandomMusic");
    randomMusicNumbersArray = [];
  }
  localStorage.setItem("localMusicRandom", localMusicRandom);
});

// Function to use imitate Spotify behaviors when music ended
player.$audio.addEventListener("ended", () => {
  // If the random mode is activated and if the music play mode is playlist-loop,
  // then we put the next random music index in the music index and call nextMusicChanger function to change music
  // Else we use the basic playlist-loop, music-loop or no-loop behavior
  if (localMusicRandom == "random") {
    if (!localIndexRandomMusic) {
      var localIndexRandomMusic = 0;
    }
    musicNumber = randomMusicNumbersArray[localIndexRandomMusic];
    if (localMusicMode == "playlist-loop") {
      if (localIndexRandomMusic < randomMusicNumbersArray.length - 1) {
        localIndexRandomMusic++;
      } else {
        localIndexRandomMusic = 0;
      }
      nextMusicChanger();
    } else if (localMusicMode == "music-loop") {
      player.$audio.loop = true;
      player.$audio.play();
    } else if (localMusicMode == "no-loop") {
      player.$audio.loop = false;
      player.$audio.currentTime = 0;
      playMusic();
      simpleUpdateSeekBar();
    }
  } else {
    if (localMusicMode == "playlist-loop") {
      nextMusicChanger();
    } else if (localMusicMode == "music-loop") {
      player.$audio.loop = true;
      player.$audio.play();
    } else if (localMusicMode == "no-loop") {
      player.$audio.loop = false;
      player.$audio.currentTime = 0;
      playMusic();
      simpleUpdateSeekBar();
    }
  }
});

/////////////////////////
// KEYBOARD SHORTCUTS //
///////////////////////

window.addEventListener("keydown", (_event) => {
  // CTRL + Left arrow = previous music
  if (_event.ctrlKey && _event.keyCode == 37) {
    previousMusicChanger();
  } else if (_event.ctrlKey && _event.keyCode == 39) {
    // CTRL + Right arrow = next music
    nextMusicChanger();
  } else if (_event.keyCode == 32) {
    // Spacebar = play/pause
    _event.preventDefault();
    playMusic();
  }
});
