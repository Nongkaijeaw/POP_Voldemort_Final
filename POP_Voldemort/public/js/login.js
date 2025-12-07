


const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toRegisterBtn = document.getElementById('to-register');
const toLoginBtn = document.getElementById('to-login');


toRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

toLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});


document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;

    if (!username || !password) {
        alert("กรุณากรอกชื่อและรหัสผ่าน");
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.status === 'success') {
            
            window.location.href = 'index.html'; 
        } else {
            alert(data.message); 
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
    }
});


document.getElementById('profile-pic-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('preview-img');
            preview.src = event.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});


document.getElementById('regBtn').addEventListener('click', async () => {
    const username = document.getElementById('reg-user').value;
    const password = document.getElementById('reg-pass').value;
    const house_logo = document.querySelector('input[name="house_logo"]:checked');
    const profileFile = document.getElementById('profile-pic-upload').files[0];

    if (!username || !password) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
    }

    if (!house_logo) {
        alert("กรุณาเลือก House");
        return;
    }

    try {
        
        
        if (profileFile) {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            formData.append('house_logo', house_logo.value);
            formData.append('avatar', profileFile);

            const response = await fetch('/register', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            } else {
                alert(data.message);
            }
        } else {
            
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, house_logo: house_logo.value })
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            } else {
                alert(data.message);
            }
        }
    } catch (err) {
        console.error("Register Error:", err);
        alert("เกิดข้อผิดพลาดในการสมัครสมาชิก");
    }
});
