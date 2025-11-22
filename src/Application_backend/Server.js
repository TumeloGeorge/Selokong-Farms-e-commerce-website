/*
* Name: Server.js
* Description: Backend server setup using Express.js and PostgreSQL.
* Author: Tumelo George
* Date: November 22, 2025
*/
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('../DB');
const cors = require('cors');
require('dotenv').config({path: '.env'});

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Test api endpoint
app.get('/', (req, res) => {
    res.send('Welcome to the Selokong Farms Backend Server!');
});

// CRUD Endpoints for Products
app.get('/products', async (req, res) => {
    try {
        const result = await Pool.query('SELECT * FROM products');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Port  Listener
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});