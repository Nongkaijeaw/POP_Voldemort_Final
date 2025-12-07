const mysql = require('mysql');

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pop_voldemort'
});

con.connect((err) => {
    if (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
    
    console.log('Connected to database');
    
    con.query("SELECT id, username, img_path, house_logo FROM users WHERE img_path IS NULL OR img_path = 'default.png' OR img_path = ''", (err, users) => {
        if (err) {
            console.error('Query failed:', err.message);
            con.end();
            process.exit(1);
        }
        
        console.log(`Found ${users.length} users to update\n`);
        
        if (users.length === 0) {
            console.log('✓ All users already have profile pictures!');
            con.end();
            process.exit(0);
        }
        
        let updated = 0;
        users.forEach(user => {
            if (user.house_logo) {
                const houseName = user.house_logo.replace('_logo.png', '');
                const newImgPath = `Profile_${houseName}_Base.png`;
                
                con.query(`UPDATE users SET img_path = '${newImgPath}' WHERE id = ${user.id}`, (err) => {
                    if (err) {
                        console.error(`✗ ${user.username} failed:`, err.message);
                    } else {
                        updated++;
                        console.log(`✓ ${user.username} -> ${newImgPath}`);
                    }
                    
                    if (updated === users.length) {
                        console.log(`\n✓ Updated ${updated}/${users.length} users successfully!`);
                        con.end();
                        process.exit(0);
                    }
                });
            }
        });
    });
});
