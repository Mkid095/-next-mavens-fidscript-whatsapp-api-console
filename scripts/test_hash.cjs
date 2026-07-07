const initSqlJs = require('/home/ken/fidscript-whatsapp/server/node_modules/sql.js');
const bcrypt = require('/home/ken/fidscript-whatsapp/server/node_modules/bcryptjs');
const path = require('path');

const dbPath = '/home/ken/fidscript-whatsapp/server/dist/fidscript.db';
const fs = require('fs');

initSqlJs().then(SQL => {
  const buffer = fs.readFileSync(dbPath);
  const database = new SQL.Database(buffer);

  const users = database.exec("SELECT email, password_hash FROM users WHERE email = 'revccnt@gmail.com'");
  const clients = database.exec("SELECT email, password_hash FROM clients WHERE email = 'kennedygithinjioffice@gmail.com'");

  console.log('=== Users ===');
  console.log(JSON.stringify(users[0]));
  console.log('=== Clients ===');
  console.log(JSON.stringify(clients[0]));

  if (users[0]?.values?.[0]) {
    const hash = users[0].values[0][1];
    console.log('User hash:', hash);
    console.log('bcrypt compare:', bcrypt.compareSync('Elishiba@95', hash));
  }
}).catch(console.error);
