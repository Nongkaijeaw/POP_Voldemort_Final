const urlParams = new URLSearchParams(window.location.search);
const targetUserParam = urlParams.get('user'); 
let currentProfileId = null;
let isOwnProfile = false;
let currentUsername = null;


async function loadProfile() {
    
    const url = targetUserParam ? `/api/profile?user=${targetUserParam}` : '/api/profile';
    
    try {
        const res = await fetch(url);
        if (!res.ok) {
            alert("User not found");
            window.location.href = 'index.html';
            return;
        }
        const user = await res.json();
        currentProfileId = user.id;
        currentUsername = user.username;
        isOwnProfile = !targetUserParam; 

        
        document.getElementById('username').innerText = user.username;
        document.getElementById('bio').innerText = user.bio || "No bio yet.";
        document.getElementById('bio-edit').value = user.bio || "";
        document.getElementById('score-display').innerText = user.score;
        document.getElementById('like-count').innerText = user.likes;
        
        document.getElementById('profile-img').src = 'images/' + user.img_path;

        
        
        if(targetUserParam) {
            document.getElementById('edit-btn').style.display = 'none';
            document.getElementById('edit-bio-btn').style.display = 'none';
        } else {
            document.getElementById('edit-bio-btn').style.display = 'inline-block';
        }

        
        loadComments(user.id);

    } catch (err) {
        console.error(err);
    }
}


document.getElementById('file-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const res = await fetch('/api/upload_profile', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.status === 'success') {
            
            document.getElementById('profile-img').src = 'images/' + data.filename;
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
    }
});


document.getElementById('like-section').addEventListener('click', async () => {
    if (!currentProfileId) return;

    try {
        const res = await fetch('/api/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetId: currentProfileId })
        });
        const data = await res.json();
        
        let count = parseInt(document.getElementById('like-count').innerText);
        const icon = document.getElementById('like-icon');

        if (data.status === 'liked') {
            count++;
            icon.style.color = 'red';
        } else {
            count--;
            icon.style.color = 'gray';
        }
        document.getElementById('like-count').innerText = count;

    } catch (err) {
        console.error(err);
    }
});


async function loadComments(userId) {
    const res = await fetch(`/api/comments?target_id=${userId}`);
    const comments = await res.json();
    
    const list = document.getElementById('comments-list');
    list.innerHTML = ''; 

    comments.forEach(c => {
        const html = `
            <div class="comment-item">
                <img src="images/${c.img_path}" class="comment-avatar">
                <div class="comment-content">
                    <h4>${c.username}</h4>
                    <p>${c.message}</p>
                    <small>${new Date(c.timestamp).toLocaleString()}</small>
                </div>
            </div>
        `;
        list.innerHTML += html;
    });
}


async function postComment() {
    const msg = document.getElementById('comment-msg').value;
    if(!msg) return;

    await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: currentProfileId, message: msg })
    });

    document.getElementById('comment-msg').value = '';
    loadComments(currentProfileId); 
}


document.getElementById('edit-bio-btn').addEventListener('click', () => {
    document.getElementById('bio').style.display = 'none';
    document.getElementById('edit-bio-btn').style.display = 'none';
    document.getElementById('bio-edit').style.display = 'block';
    document.getElementById('bio-actions').style.display = 'block';
});

document.getElementById('cancel-bio-btn').addEventListener('click', () => {
    document.getElementById('bio').style.display = 'block';
    document.getElementById('edit-bio-btn').style.display = 'inline-block';
    document.getElementById('bio-edit').style.display = 'none';
    document.getElementById('bio-actions').style.display = 'none';
});

document.getElementById('save-bio-btn').addEventListener('click', async () => {
    const newBio = document.getElementById('bio-edit').value;
    
    console.log('Saving bio:', newBio);
    
    try {
        const res = await fetch('/api/update_bio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bio: newBio })
        });
        
        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Response data:', data);
        
        if (data.status === 'success') {
            document.getElementById('bio').innerText = newBio || "No bio yet.";
            document.getElementById('bio').style.display = 'block';
            document.getElementById('edit-bio-btn').style.display = 'inline-block';
            document.getElementById('bio-edit').style.display = 'none';
            document.getElementById('bio-actions').style.display = 'none';
        } else {
            alert(data.error || 'Failed to update bio');
            console.error('Error from server:', data);
        }
    } catch (err) {
        console.error('Error updating bio:', err);
        alert('Error updating bio: ' + err.message);
    }
});

loadProfile();
