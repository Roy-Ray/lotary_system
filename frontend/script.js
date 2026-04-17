const API = window.location.origin;
let currentRotation = 0;
let isSpinning = false; 
let shuffleTimer; // Tracks the animated shuffle loop

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

    // 🔴 Change Title Dynamically
    document.querySelector(".leaderboard-section h2").innerText = "🏆 Top Scorers (90 - 100)";

    // 🔴 Filter ONLY participants who scored between 90 and 100
    const topScorers = data.filter(p => p.score >= 90 && p.score <= 100);

    if (topScorers.length > 0) {
      startScorerShuffle(topScorers); // Start the slow animated shuffle
    } else {
      document.getElementById("top10").innerHTML = "<p class='loading-text'>No top scorers yet!</p>";
    }

    // Filter Eligible VIPs strictly by their is_eligible status in MySQL
    const eligiblePerformers = data.filter(p => p.is_eligible === 1 || p.is_eligible === true);
    window.currentEligible = eligiblePerformers; // Save globally for spin physics

    if (eligiblePerformers.length > 0) {
      const badgesHTML = eligiblePerformers.map(p => `
        <div class="eligible-badge">
          <img src="${p.image_url || 'https://via.placeholder.com/60?text=' + p.name.charAt(0)}" />
          <div class="badge-info"><h4>${p.name}</h4><p>${p.district}</p></div>
        </div>
      `).join("");
      document.getElementById("eligible-list").innerHTML = badgesHTML + badgesHTML;
      
      renderWheel(eligiblePerformers); // Generate the wheel with names
    } else {
      document.getElementById("eligible-list").innerHTML = "<p class='loading-text'>No eligible participants yet!</p>";
      renderWheel([]); 
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

/* 🔴 NEW: SLOW ANIMATED SHUFFLE LOGIC */
function startScorerShuffle(scorers) {
  const grid = document.getElementById("top10");
  
  // Apply a very slow, smooth fade CSS transition to the grid
  grid.style.transition = "opacity 1.5s ease-in-out"; 
  
  function updateGrid() {
    grid.style.opacity = 0; // Trigger fade out
    
    setTimeout(() => {
      // Shuffle the array randomly while hidden
      const shuffled = [...scorers].sort(() => Math.random() - 0.5);
      
      // Re-render without the <div class="rank"> numbering
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
      
      grid.style.opacity = 1; // Trigger slow fade back in
    }, 1500); // Wait 1.5 seconds for the fade-out to completely finish
  }
  
  updateGrid(); // Run the first time immediately
  
  if (shuffleTimer) clearInterval(shuffleTimer);
  shuffleTimer = setInterval(updateGrid, 7000); // Repeat the fade shuffle every 7 seconds
}


/* 2. DYNAMIC WHEEL GENERATOR */
function renderWheel(candidates) {
  const wheel = document.getElementById("wheel");
  wheel.innerHTML = ""; // Clear existing slices

  if (!candidates || candidates.length === 0) {
    wheel.style.background = "conic-gradient(from 0deg, #FF0055 0deg 360deg)";
    return;
  }

  const colors = ['#FF0055', '#7000FF', '#00E5FF', '#FFCC00', '#00FFCC', '#FF00CC'];
  const sliceAngle = 360 / candidates.length;
  let gradientString = 'conic-gradient(from 0deg, ';

  candidates.forEach((c, i) => {
    const color = colors[i % colors.length];
    const startAngle = i * sliceAngle;
    const endAngle = (i + 1) * sliceAngle;
    gradientString += `${color} ${startAngle}deg ${endAngle}deg${i < candidates.length - 1 ? ', ' : ''}`;

    const textEl = document.createElement("div");
    textEl.className = "wheel-text";
    textEl.innerText = c.name.split(' ')[0]; 

    const textAngle = startAngle + (sliceAngle / 2) - 90;
    textEl.style.transform = `translateY(-50%) rotate(${textAngle}deg) translateX(65px)`;

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
    console.error("❌ Error loading event time:", error);
    document.getElementById("event-name").innerText = "আশার আলো, ছকে খেলো";
    document.getElementById("organizer-name").innerText = "Dipon Bandyapadyay & Team™";
    runCountdown(new Date("2026-04-17T11:23:00").getTime());
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

/* 4. SPIN LOGIC WITH ACCURATE LANDING PHYSICS */
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

    setTimeout(() => {
      winnerText.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; animation: popIn 0.5s cubic-bezier(0.17, 0.67, 0.12, 0.99);">
            <img src="${data.image_url || 'https://via.placeholder.com/100'}" 
                 style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid #00ffcc; box-shadow: 0 0 25px rgba(0, 255, 204, 0.8); object-fit: cover;">
            <div style="text-align: left; line-height: 1.2;">
                <span style="font-size: 1rem; color: #fff; text-transform: uppercase; letter-spacing: 2px;">🎉 Winner</span><br>
                <strong style="color: #00ffcc; font-size: 2.2rem; text-shadow: 0 0 15px #00ffcc;">${data.name}</strong><br>
                <span style="color: #ffcc00; font-size: 1.1rem;">📍 ${data.district}</span>
            </div>
        </div>
      `;
      
      setTimeout(() => {
        wheel.classList.remove("spinning"); 
        isSpinning = false; 
      }, 3000);
    }, 5000); 

  } catch (error) {
    console.error("❌ Spin error:", error);
    winnerText.innerText = "❌ Error Occurred";
    isSpinning = false;
    wheel.classList.remove("spinning");
  }
}

/* 5. UI INTERACTIVE LOGIC (Popups) */
function openPopup() {
  document.getElementById("code").value = ""; 
  document.getElementById("popup").style.display = "block";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
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

/* 7. LIVE VISITOR TRACKING & ANIMATION */
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

/* INITIALIZE */
loadTop10();
loadTimer();
startVisitorCounter();
requestAnimationFrame(idleSpin);