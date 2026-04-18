const API = window.location.origin;
let currentRotation = 0;
let isSpinning = false; 
let shuffleTimer; 

/* 1. LOAD LEADERBOARD & ELIGIBLE PERFORMERS FROM DATABASE */
async function loadTop10() {
  try {
    const res = await fetch(API + "/participants");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    let data = await res.json();

    if (!data || data.length === 0) {
      document.getElementById("top10").innerHTML = "<p class='loading-text'>No participants found.</p>";
      return;
    }

    document.querySelector(".leaderboard-section h2").innerText = "🏆 Top Scorers (90 - 100)";
    const topScorers = data.filter(p => p.score >= 90 && p.score <= 100);

    if (topScorers.length > 0) {
      startScorerShuffle(topScorers); 
    } else {
      document.getElementById("top10").innerHTML = "<p class='loading-text'>No top scorers yet!</p>";
    }

    const eligiblePerformers = data.filter(p => p.is_eligible === 1 || p.is_eligible === true);
    window.currentEligible = eligiblePerformers; 

    if (eligiblePerformers.length > 0) {
      const badgesHTML = eligiblePerformers.map(p => `
        <div class="eligible-badge">
          <img src="${p.image_url || 'https://via.placeholder.com/60?text=' + p.name.charAt(0)}" />
          <div class="badge-info"><h4>${p.name}</h4><p>${p.district}</p></div>
        </div>
      `).join("");
      document.getElementById("eligible-list").innerHTML = badgesHTML + badgesHTML;
      
      renderWheel(eligiblePerformers); 
    } else {
      document.getElementById("eligible-list").innerHTML = "<p class='loading-text'>No eligible participants yet!</p>";
      renderWheel([]); 
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

function startScorerShuffle(scorers) {
  const grid = document.getElementById("top10");
  grid.style.transition = "opacity 1.5s ease-in-out"; 
  
  function updateGrid() {
    grid.style.opacity = 0; 
    
    setTimeout(() => {
      const shuffled = [...scorers].sort(() => Math.random() - 0.5);
      grid.innerHTML = shuffled.map(p => `
        <div class="card">
          <img src="${p.image_url || 'https://via.placeholder.com/45?text=' + p.name.charAt(0)}" onclick="showLargeImage('${p.image_url}')" />
          <div class="info">
            <h4 onclick="showUserInfo('${p.name}', '${p.district}', ${p.score})">${p.name}</h4>
            <p>${p.district}</p>
          </div>
          <div class="score">⭐ ${p.score}</div>
        </div>
      `).join("");
      
      grid.style.opacity = 1; 
    }, 1500); 
  }
  
  updateGrid(); 
  if (shuffleTimer) clearInterval(shuffleTimer);
  shuffleTimer = setInterval(updateGrid, 7000); 
}

/* 2. DYNAMIC WHEEL GENERATOR */
function renderWheel(candidates) {
  const wheel = document.getElementById("wheel");
  wheel.innerHTML = ""; 

  if (!candidates || candidates.length === 0) {
    wheel.style.background = "conic-gradient(from 0deg, #FF0055 0deg 360deg)";
    return;
  }

  const colors = ['#FF0055', '#7000FF', '#00E5FF', '#FFCC00', '#00FFCC', '#FF00CC'];
  const sliceAngle = 360 / candidates.length;
  let gradientString = 'conic-gradient(from 0deg, ';

  // 🔥 NEW FIX: Pull text closer to the center circle on mobile screens
  const textOffset = window.innerWidth <= 600 ? 35 : 65;

  candidates.forEach((c, i) => {
    const color = colors[i % colors.length];
    const startAngle = i * sliceAngle;
    const endAngle = (i + 1) * sliceAngle;
    gradientString += `${color} ${startAngle}deg ${endAngle}deg${i < candidates.length - 1 ? ', ' : ''}`;

    const textEl = document.createElement("div");
    textEl.className = "wheel-text";
    textEl.innerText = c.name.split(' ')[0]; 

    const textAngle = startAngle + (sliceAngle / 2) - 90;
    
    // 🔥 Injecting our responsive textOffset here
    textEl.style.transform = `translateY(-50%) rotate(${textAngle}deg) translateX(${textOffset}px)`;

    wheel.appendChild(textEl);

    const lineEl = document.createElement("div");
    lineEl.className = "slice-border";
    lineEl.style.transform = `rotate(${endAngle}deg)`;
    wheel.appendChild(lineEl);
  });

  gradientString += ')';
  wheel.style.background = gradientString;
}

/* 3. LIVE TIMER FUNCTION */
async function loadTimer() {
  try {
    const res = await fetch(API + "/event");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = await res.json();
    if (!data || !data.event_name) throw new Error("Invalid event data");

    document.getElementById("event-name").innerText = data.event_name;
    document.getElementById("organizer-name").innerText = data.organizer_name;

    const eventTime = new Date(data.event_time).getTime();
    runCountdown(eventTime);
  } catch (error) {
    document.getElementById("event-name").innerText = "আশার আলো, ছকে খেলো";
    document.getElementById("organizer-name").innerText = "Dipan Bandyopadhyay & Team™";
    runCountdown(new Date("2026-04-18T22:00:00").getTime());
  }
}

function runCountdown(eventTime) {
  const timerElement = document.getElementById("timer");

  const interval = setInterval(() => {
    const now = new Date().getTime();
    const diff = eventTime - now;

    if (diff <= 0) {
      clearInterval(interval);
      timerElement.innerText = "🎯 Event Started!";
      timerElement.style.color = "#00ffcc";
      document.getElementById("winner").innerText = "Ready for Spin 🎡";
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    timerElement.innerText = `⏳ ${h}h ${m}m ${s}s`;
  }, 1000);
}

/* 4. SPIN LOGIC WITH CONFETTI & SOUND EFFECTS */
async function spin() {
  const code = document.getElementById("code").value;

  if (code !== "1234") {
    alert("❌ Wrong Access Code");
    return;
  }

  closePopup();

  const wheel = document.getElementById("wheel");
  const winnerText = document.getElementById("winner");
  const spinSound = document.getElementById("spin-sound"); 
  
  winnerText.innerText = "Spinning...";
  winnerText.style.color = "white";

  if (spinSound) {
      spinSound.currentTime = 0;
      spinSound.play().catch(err => console.log("Audio blocked:", err));
  }

  try {
    const res = await fetch(API + "/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });

    if (!res.ok) throw new Error("Server error");
    const data = await res.json();

    isSpinning = true;
    wheel.classList.add("spinning");

    let finalAngle = Math.floor(Math.random() * 360);
    const winnerIndex = window.currentEligible ? window.currentEligible.findIndex(p => p.name === data.name) : -1;

    if (winnerIndex !== -1) {
        const sliceAngle = 360 / window.currentEligible.length;
        const middleAngle = (winnerIndex * sliceAngle) + (sliceAngle / 2);
        finalAngle = 360 - middleAngle; 
    }

    const currentMod = currentRotation % 360;
    currentRotation = currentRotation + (360 - currentMod) + 1800 + finalAngle; 
    wheel.style.transform = `rotate(${currentRotation}deg)`;

    // TRIGGER WINNER REVEAL AFTER 5 SECONDS
    setTimeout(() => {
      // 1. Play Correct/Winning Audio
      const applauseSound = document.getElementById("applause-sound");
      if (applauseSound) {
        applauseSound.currentTime = 0;
        applauseSound.play().catch(e => console.log(e));
        
        setTimeout(() => {
            applauseSound.pause();
            applauseSound.currentTime = 0;
        }, 4000);
      }
      // 2. Populate and Show the Big Winner Modal
      const winnerModal = document.getElementById("winner-modal");
      document.getElementById("winner-img").src = data.image_url || 'https://via.placeholder.com/220';
      document.getElementById("winner-name-display").innerText = data.name;
      document.getElementById("winner-district-display").innerText = `📍 ${data.district}`;
      winnerModal.style.display = "flex";

      // 🔴 FIXED: Dynamically inject new winners without erasing old ones
      const latestWinnerBox = document.getElementById("latest-winner-box");
      const latestWinnerContent = document.getElementById("latest-winner-content");
      
      if (latestWinnerBox && latestWinnerContent) {
          const newWinnerHTML = `
            <div class="latest-winner-card">
              <img src="${data.image_url || 'https://via.placeholder.com/60'}" alt="Winner">
              <div style="text-align: left;">
                <h3>${data.name}</h3>
                <p>📍 ${data.district}</p>
              </div>
            </div>
          `;
          
          // 'afterbegin' pushes the newest winner to the front of the list!
          latestWinnerContent.insertAdjacentHTML('afterbegin', newWinnerHTML);
          latestWinnerBox.style.display = "block"; // Unhide the box
      }

      // 3. Fire Confetti
      const duration = 4000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff00cc', '#00ffcc', '#ffcc00', '#ffffff'],
          zIndex: 10000 
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff00cc', '#00ffcc', '#ffcc00', '#ffffff'],
          zIndex: 10000 
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

      winnerText.innerHTML = `🎉 Winner: <strong>${data.name}</strong>`;
      winnerText.style.color = "#00ffcc";
      wheel.classList.remove("spinning"); 
      isSpinning = false; 

    }, 5000); 

  } catch (error) {
    console.error("❌ Spin error:", error);
    winnerText.innerText = "❌ Error Occurred";
    isSpinning = false;
    wheel.classList.remove("spinning");
  }
}

/* 5. UI INTERACTIVE LOGIC */
function openPopup() {
  document.getElementById("code").value = ""; 
  document.getElementById("popup").style.display = "block";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}

function closeWinnerModal() {
  document.getElementById("winner-modal").style.display = "none";
}

function showLargeImage(url) {
  const overlay = document.getElementById("img-overlay");
  document.getElementById("enlarged-img").src = url;
  overlay.style.display = "flex";
  setTimeout(() => { overlay.style.display = "none"; }, 1000);
}

let userPopupTimer;
function showUserInfo(name, district, score) {
  const popup = document.getElementById("user-popup");
  document.getElementById("popup-name").innerText = name;
  document.getElementById("popup-district").innerText = district;
  document.getElementById("popup-score-val").innerText = score;
  popup.classList.add("show");
  clearTimeout(userPopupTimer);
  userPopupTimer = setTimeout(() => { popup.classList.remove("show"); }, 2500);
}

/* 6. CONTINUOUS WIND EFFECT */
function idleSpin() {
  if (!isSpinning) {
    currentRotation += 0.2; 
    document.getElementById("wheel").style.transform = `rotate(${currentRotation}deg)`;
  }
  requestAnimationFrame(idleSpin);
}

/* 7. LIVE VISITOR TRACKING */
async function startVisitorCounter() {
  const initialUrl = API + "/visit"; 
  await fetchAndAnimate(initialUrl);

  setInterval(() => {
    fetchAndAnimate(API + "/visitors");
  }, 5000);
}

async function fetchAndAnimate(fetchUrl) {
  try {
    const res = await fetch(fetchUrl);
    if (!res.ok) return;
    const data = await res.json();
    
    const counterEl = document.getElementById("view-count");
    if(!counterEl) return; 
    const currentCount = parseInt(counterEl.innerText) || 0;
    const newCount = data.views;

    if (newCount > currentCount) {
      let start = currentCount === 0 ? newCount - 5 : currentCount; 
      const stepTime = 50; 
      
      const timer = setInterval(() => {
        start += 1;
        counterEl.innerText = start;
        
        if (start >= newCount) {
          clearInterval(timer);
          counterEl.innerText = newCount; 
        }
      }, stepTime);
    }
  } catch (error) {
    console.log("Live counter updating...");
  }
}

async function loadWinners() {
  try {
    const res = await fetch(API + "/winners"); // Tell your backend dev to make this API!
    if (!res.ok) return; 
    
    const data = await res.json();

    if (data && data.length > 0) {
      const box = document.getElementById("latest-winner-box");
      const content = document.getElementById("latest-winner-content");
      
      content.innerHTML = data.map(w => `
        <div class="latest-winner-card">
          <img src="${w.image_url || 'https://via.placeholder.com/60'}" alt="Winner">
          <div style="text-align: left;">
            <h3>${w.name}</h3>
            <p>📍 ${w.district}</p>
          </div>
        </div>
      `).join("");
      
      box.style.display = "block"; // Unhide the box
    }
  } catch (error) {
    console.log("No previous winners loaded yet.");
  }
}

loadTop10();
loadTimer();
startVisitorCounter();
loadWinners();
requestAnimationFrame(idleSpin);