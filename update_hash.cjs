const initSqlJs = require('./server/node_modules/sql.js');
const bcrypt = require('./server/node_modules/bcryptjs');
const fs = require('fs');

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync('./server/fidscript.db'));

  const hash = bcrypt.hashSync('Elishiba@95', 10);
  console.log('Hash:', hash);

  db.run(`UPDATE users SET password_hash = '${hash}' WHERE email = 'revccnt@gmail.com'`);
  db.run(`UPDATE clients SET password_hash = '${hash}' WHERE email = 'kennedygithinjioffice@gmail.com'`);

  fs.writeFileSync('./server/fidscript.db', db.export());
  console.log('Done');

  const users = db.exec("SELECT email, password_hash FROM users WHERE email = 'revccnt@gmail.com'");
  const clients = db.exec("SELECT email, password_hash FROM clients WHERE email = 'kennedygithinjioffice@gmail.com'");
  console.log('Users hash:', users[0]?.values[0]);
  console.log('Clients hash:', clients[0]?.values[0]);
}

main().catch(console.error);
