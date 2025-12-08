// ========== ELEMENT REFERENCES ==========
// อ้างอิงองค์ประกอบ HTML หลัก
const img = document.getElementById("popcat1");
const scoreText = document.getElementById("score");
const myScoreText = document.getElementById('my_score');
const logoutBtn = document.getElementById('logoutBtn');

// ========== GAME ASSETS ==========
// เสียง และรูปภาพที่ใช้ในเกม
const audio = new Audio('sounds/Oow.mp3'); 
const imgPop = 'images/Voldemort_POP.png';
const imgSmile = 'images/Voldemort_smile.png';

// ========== GAME STATE ==========
// ตัวแปรเก็บค่าคะแนน
let score = 0;

// ========== PANEL TOGGLE FUNCTION ==========
// ฟังก์ชัน Expand/Collapse Leaderboard Panel
function togglePanel(panelId) {
    const panel = document.querySelector('.' + panelId);
    if (panel) {
        panel.classList.toggle('collapsed');
    }
}

// ========== LOAD SCORE FUNCTION ==========
// ดึงคะแนนล่าสุดจาก Server
async function loadScore() {
    try {
        // ส่ง Request ไป /score endpoint
        const res = await fetch('/score');
        
        // ตรวจสอบว่า Session ยังใช้งานได้
        if (res.status === 401) {
            alert("Session หมดอายุ หรือยังไม่ได้เข้าสู่ระบบ");
            window.location.href = 'login.html'; 
            return;
        }

        if(res.ok) {
            const data = await res.json();
            score = data.score;
            // อัปเดตการแสดงคะแนนบนหน้า
            updateDisplay(score);
        }
    } catch (err) {
        console.error("Load score error:", err);
    }
}

// ========== SEND CLICK TO SERVER ==========
// ส่งคะแนนไปบันทึกทุกครั้งที่กด
async function sendClick() {
    try {
        // POST ไป /score endpoint เพื่อเพิ่มคะแนน
        await fetch('/score', { method: 'POST' });
    } catch (err) {
        console.error("Update score error:", err);
    }
}

// ========== UPDATE DISPLAY FUNCTION ==========
// อัปเดตการแสดงคะแนนบนหน้า
function updateDisplay(num) {
    // แปลงเลขให้มีเครื่องหมายจุลภาค
    scoreText.innerText = num.toLocaleString(); 
    if(myScoreText) myScoreText.innerText = num.toLocaleString();
    
    // อัปเดตในตารางถ้ามี
    const tableScore = document.getElementById("table_score");
    if(tableScore) tableScore.innerText = num.toLocaleString();
}

// ========== POP FUNCTION ==========
// ฟังก์ชันเมื่อกดรูป Voldemort
function pop() {
    score++;
    // อัปเดตคะแนนทันที
    updateDisplay(score); 
    // ส่งคะแนนไปเซิร์ฟเวอร์
    sendClick();          
    
    // รีเซ็ตเวลาเสียงเพื่อให้กดรัวๆได้
    audio.currentTime = 0;
    audio.play();
    
    // เปลี่ยนรูปตอนกด
    img.src = imgPop;
}

// ========== UNPOP FUNCTION ==========
// ฟังก์ชันเมื่อปล่อยจากรูป Voldemort
function unpop() {
    img.src = imgSmile;
}

// ========== MOUSE & TOUCH EVENT LISTENERS ==========
// รองรับการกดทั้ง Mouse และ Touch
img.addEventListener("mousedown", pop);
img.addEventListener("mouseup", unpop);

// Touch events สำหรับมือถือ
img.addEventListener("touchstart", (e) => {
    e.preventDefault(); 
    pop();
});
img.addEventListener("touchend", (e) => {
    e.preventDefault();
    unpop();
});

// ========== LOGOUT BUTTON ==========
// ปุ่ม Logout - ลบ Cookie และกลับไปหน้า Login
if(logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if(confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
            try {
                // เรียก API logout
                await fetch('/logout'); 
                window.location.href = 'login.html'; 
            } catch (err) {
                alert("Logout failed");
            }
        }
    });
}

// ========== LOAD LEADERBOARD FUNCTION ==========
// ดึงข้อมูล Top 10 Students จากเซิร์ฟเวอร์
async function loadLeaderboard() {
    try {
        const res = await fetch('/leaderboard');
        const data = await res.json();
        
        const table = document.getElementById("table");
        const topPlayersDisplay = document.getElementById("top-players-display");
        if (!table) return;

        allStudents = data;

        
        let topPlayersHTML = '';
        for (let i = 0; i < Math.min(3, data.length); i++) {
            const player = data[i];
            const rankClass = `rank-${i + 1}`;
            topPlayersHTML += `
                <div class="top-player-badge">
                    <div class="player-rank ${rankClass}">${i + 1}</div>
                    <div>
                        <div class="player-name">${player.username}</div>
                        <div class="player-score">${player.score.toLocaleString()}</div>
                    </div>
                </div>
            `;
        }
        if (topPlayersDisplay) topPlayersDisplay.innerHTML = topPlayersHTML;

        
        let html = `
            <tr class="bordered">
                <th>#</th>
                <th>House</th>
                <th>Profile</th>
                <th>Name</th>
                <th>Pop Count</th>
            </tr>
        `;

        const myName = getMyUsername(); 

        data.forEach((user, index) => {
            
            const profileLink = `profile.html?user=${user.username}`;
            
            
            const isMe = (user.username === myName);
            
            
            let rowClass = "bordered";
            if (index === 0) rowClass += " top-1";
            else if (index === 1) rowClass += " top-2";
            else if (index === 2) rowClass += " top-3";
            if (isMe) rowClass += " my-row";
            
            const rowStyle = isMe && index > 2 ? "background-color: #d1e7dd;" : "";

            html += `
                <tr class="${rowClass}" style="cursor: pointer; ${rowStyle}" onclick="location.href='${profileLink}'">
                    <td>${index + 1}</td>
                    <td><img src="images/${user.house_logo}" style="width:30px; height:30px; border-radius:5px; object-fit:contain; border: 1px solid #aaa;"></td>
                    <td><img src="images/${user.img_path}" style="width:35px; height:35px; border-radius:50%; object-fit:cover; border: 1px solid #aaa;"></td>
                    <td>${user.username} ${isMe ? '(You)' : ''}</td>
                    <td style="text-align: right; font-weight: bold; color: white;">${user.score.toLocaleString()}</td>
                </tr>
            `;
        });

        table.innerHTML = html;

    } catch (err) {
        console.error("Load leaderboard error:", err);
    }
}


async function loadHouseLeaderboard() {
    try {
        const res = await fetch('/house-leaderboard');
        const data = await res.json();
        console.log("House Leaderboard Data:", data);
        
        const table = document.getElementById("house-table");
        const topHousesHeader = document.getElementById("top-houses-header");
        if (!table) {
            console.error("house-table element not found");
            return;
        }

        
        let topHousesHTML = '';
        for (let i = 0; i < Math.min(3, data.length); i++) {
            const house = data[i];
            const rankClass = `rank-${i + 1}`;
            topHousesHTML += `
                <div class="house-badge">
                    <img src="images/${house.house_logo}" alt="${house.name}" title="${house.name}">
                    <div class="house-badge-rank ${rankClass}">${i + 1}</div>
                </div>
            `;
        }
        if (topHousesHeader) topHousesHeader.innerHTML = topHousesHTML;

        
        const podiumDisplay = document.getElementById("top-houses-display");
        let podiumHTML = '';
        for (let i = 0; i < Math.min(3, data.length); i++) {
            const house = data[i];
            const rankClass = `rank-${i + 1}`;
            podiumHTML += `
                <div class="house-podium ${rankClass}">
                    <div class="podium-rank ${rankClass}">${i + 1}</div>
                    <img src="images/${house.house_logo}" alt="${house.name}">
                    <div class="house-name ${rankClass}">${house.name}</div>
                    <div class="house-score">${(house.total_score || 0).toLocaleString()} pts</div>
                </div>
            `;
        }
        if (podiumDisplay) podiumDisplay.innerHTML = podiumHTML;

        
        let html = `
            <tr class="bordered">
                <th>#</th>
                <th>House</th>
                <th>Members</th>
                <th>Total Pop Count</th>
            </tr>
        `;

        
        data.forEach((house, index) => {
            
            let rowClass = "bordered";
            if (index === 0) rowClass += " top-1";
            else if (index === 1) rowClass += " top-2";
            else if (index === 2) rowClass += " top-3";

            html += `
                <tr class="${rowClass}" style="cursor: default;">
                    <td><strong>${index + 1}</strong></td>
                    <td><img src="images/${house.house_logo}" style="width:30px; height:30px; border-radius:5px; object-fit:contain; border: 1px solid #aaa;"> <strong>${house.name}</strong></td>
                    <td>${house.member_count || 0}</td>
                    <td style="text-align: right; font-weight: bold; color: white;">${(house.total_score || 0).toLocaleString()}</td>
                </tr>
            `;
        });

        table.innerHTML = html;

    } catch (err) {
        console.error("Load house leaderboard error:", err);
    }
}


function getMyUsername() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; username=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}


loadScore();           
loadLeaderboard();     
loadHouseLeaderboard(); 

let allStudents = [];

const searchInput = document.getElementById('searchStudent');
const searchResults = document.getElementById('searchResults');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (!searchTerm) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }
        
        const filtered = allStudents.filter(student => 
            student.username.toLowerCase().includes(searchTerm)
        );
        
        if (filtered.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">No students found</div>';
            searchResults.style.display = 'block';
            return;
        }
        
        let resultsHTML = '';
        filtered.forEach(student => {
            resultsHTML += `
                <div class="search-result-item" onclick="location.href='profile.html?user=${student.username}'">
                    <img src="images/${student.img_path}" alt="${student.username}">
                    <div class="search-result-info">
                        <span>${student.username}</span>
                        <span class="search-result-score">${student.score.toLocaleString()}</span>
                    </div>
                </div>
            `;
        });
        
        searchResults.innerHTML = resultsHTML;
        searchResults.style.display = 'block';
    });
}

setInterval(loadLeaderboard, 1000);
setInterval(loadHouseLeaderboard, 1000);
