const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const mysql = require('mysql2');
const server = express();
const port = 3002;

// MySQL connection configuration
const localService = mysql.createConnection({
  host: '192.168.31.88',   // Host of MySQL server (change if necessary)
  user: 'vm1',        // MySQL user
  password: 'admin@1234',        // MySQL password
  database: 'ticketing_system'
});

// Connect to the database
localService.connect((err) => {
  if (err) {
    console.error('Could not connect to the MySQL database:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

// Use body-parser middleware
server.use(bodyParser.json());

// Create a new ticket
server.post('/tickets', async (req, res) => {
  const { userId, title, description } = req.body;

  try {
    // Check if user exists by calling vm1 service
    const userResponse = await axios.get(`http://192.168.31.85:3001/customers/${userId}`);
    const user = userResponse.data;

    if (!user) return res.status(404).json({ message: 'customer not found' });

    const query = 'INSERT INTO tickets (userId, title, description) VALUES (?, ?, ?)';
    localService.execute(query, [userId, title, description], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error creating ticket' });
      }
      const newTicket = {
        ticketId: results.insertId,
        userId,
        title,
        description,
        status: 'open'
      };
      res.status(201).json(newTicket);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error communicating with customer service' });
  }
});

// Get all tickets
server.get('/tickets', (req, res) => {
  const query = 'SELECT * FROM tickets';

  localService.execute(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error fetching tickets' });
    }
    res.json(results);
  });
});

// Update ticket status
server.put('/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const query = 'UPDATE tickets SET status = ? WHERE ticketId = ?';
  localService.execute(query, [status, id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error updating ticket status' });
    }
    if (results.affectedRows === 0) return res.status(404).json({ message: 'Ticket not found' });

    res.json({ ticketId: id, status });
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Ticket Service running on http://localhost:${port}`);
});
