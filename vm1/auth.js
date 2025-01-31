const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const server = express();
const port = 3001;

// MySQL connection configuration
const localService = mysql.createConnection({
  host: '192.168.31.88',  
  user: 'vm1',        
  password: 'admin@1234',       
  database: 'ticketing_system'
});

localService.connect((err) => {
  if (err) {
    console.error('Could not connect to the MySQL database:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

server.use(bodyParser.json());

server.post('/customers', (req, res) => {
  const { username, email } = req.body;

  const query = 'INSERT INTO customers (username, email) VALUES (?, ?)';
  localService.execute(query, [username, email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error creating customer' });
    }
    const newUser = {
      userId: results.insertId,
      username,
      email
    };
    res.status(201).json(newUser);
  });
});

server.get('/customers/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM customers WHERE userId = ?';

  localService.execute(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error fetching customer' });
    }
    if (results.length === 0) return res.status(404).json({ message: 'customer not found' });

    res.json(results[0]);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Customer Service running on http://localhost:${port}`);
});
