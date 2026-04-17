const API = window.location.origin;
let currentRotation = 0;
let isSpinning = false; 

/* 1. LOAD LEADERBOARD & ELIGIBLE PERFORMERS FROM DATABASE */
async function loadTop10() {
  try {
    const res = await fetch(API + "/top10");
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    let data = await res.json();

    // Handle empty response
    if (!data || data.length === 0) {
      document.getElementById("top10").innerHTML = "<p class='loading-text'>No participants found. Please add data to the database.</p>";
      document.getElementById("eligible-list").innerHTML = "<p class='loading-text'>No eligible participants yet.</p>";
      return;
    }

    // SORT THE DATA: Highest score to lowest score
    data.sort((a, b) => b.score - a.score);

    // Populate Top 10 List
    document.getElementById("top10").innerHTML = data.map((p, index) => `
      <div class="card">
        <div class="rank">#${index + 1}</div>
        <img src="${p.image_url || 'https://via.placeholder.com/45?text=' + p.name.charAt(0)}" alt="${p.name}" title="Click to enlarge" onerror="this.src='https://via.placeholder.com/45?text=?' " onclick="showLargeImage('${p.image_url || 'https://via.placeholder.com/45?text=' + p.name.charAt(0)}')" />
        <div class="info">
          <h4 title="Click for details" onclick="showUserInfo('${p.name}', '${p.district}', ${p.score})">${p.name}</h4>
          <p>${p.district}</p>
        </div>
        <div class="score">⭐ ${p.score}</div>
      </div>
    `).join("");

    // Filter & Populate Eligible VIPs (Score == 100)
    const eligiblePerformers = data.filter(p => p.score === 100);
    if (eligiblePerformers.length > 0) {
      const badgesHTML = eligiblePerformers.map(p => `
        <div class="eligible-badge">
          <img src="${p.image_url || 'https://via.placeholder.com/60?text=' + p.name.charAt(0)}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/60?text=?'" />
          <div class="badge-info">
            <h4>${p.name}</h4>
            <p>${p.district}</p>
          </div>
        </div>
      `).join("");
      // Duplicate for seamless circular marquee
      document.getElementById("eligible-list").innerHTML = badgesHTML + badgesHTML;
    } else {
      document.getElementById("eligible-list").innerHTML = "<p class='loading-text'>No perfect scorers yet!</p>";
    }
  } catch (error) {
    console.error("❌ Error loading top performers:", error);
    document.getElementById("top10").innerHTML = "<p class='loading-text'>⚠️ Failed to load data. Make sure the server is running on http://localhost:5000</p>";
    document.getElementById("eligible-list").innerHTML = "<p class='loading-text'>⚠️ Connection error</p>";
  }
}

/* 2. LIVE TIMER FUNCTION (FETCHED FROM DB) */
async function loadTimer() {
  try {
    const res = await fetch(API + "/event");
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();

    if (!data || !data.event_name) {
      throw new Error("Invalid event data");
    }

    document.getElementById("event-name").innerText = data.event_name;
    document.getElementById("organizer-name").innerText = data.organizer_name;

    // Use the event_time from MySQL event table
    const eventTime = new Date(data.event_time).getTime();
    runCountdown(eventTime);
  } catch (error) {
    console.error("❌ Error loading event time:", error);
    // Fallback static time if DB is unreachable
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

/* 3. SPIN LOGIC (AUTHENTICATED VIA DB) */
async function spin() {
  const code = document.getElementById("code").value;

  if (!code) {
    alert("❌ Please enter an access code");
    return;
  }

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

  isSpinning = true;
  wheel.classList.add("spinning");

  // Play "Zoooooo" Sound
  spinSound.currentTime = 0;
  spinSound.play().catch(err => console.log("Audio blocked or unavailable:", err));

  // Trigger Fast Spin Animation
  const randomExtraDegrees = Math.floor(Math.random() * 360);
  currentRotation += 1800 + randomExtraDegrees; 
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  try {
    const res = await fetch(API + "/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    // Wait for the 5s animation to finish before showing winner
    setTimeout(() => {
      winnerText.innerHTML = `🎉 Winner: <strong>${data.name}</strong><br><small>${data.district}</small>`;
      winnerText.style.color = "#00ffcc";
      
      setTimeout(() => {
        wheel.classList.remove("spinning"); 
        isSpinning = false; 
      }, 3000);
    }, 5000); 

  } catch (error) {
    console.error("❌ Spin error:", error);
    winnerText.innerText = `❌ Error: ${error.message}`;
    winnerText.style.color = "#ff6b6b";
    isSpinning = false;
    wheel.classList.remove("spinning");
  }
}

/* 4. UI INTERACTIVE LOGIC (Popups) */
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

/* 5. CONTINUOUS WIND EFFECT */
function idleSpin() {
  if (!isSpinning) {
    currentRotation += 0.2; 
    document.getElementById("wheel").style.transform = `rotate(${currentRotation}deg)`;
  }
  requestAnimationFrame(idleSpin);
}
/*/* 6. LIVE VISITOR TRACKING & ANIMATION */
async function startVisitorCounter() {
  // Hit the /visit route IMMEDIATELY on every page load/refresh
  const initialUrl = API + "/visit"; 
  
  // Fetch initial count and animate
  await fetchAndAnimate(initialUrl);

  // Poll every 5 seconds to catch new traffic from other people in real-time
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
    const currentCount = parseInt(counterEl.innerText) || 0;
    const newCount = data.views;

    // Fast count-up animation if the number goes up
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
startVisitorCounter(); // <-- ADD THIS LINE HERE
requestAnimationFrame(idleSpin);
