require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();





// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


/***********fcc URL Shortener Microservice *******************/
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const crypto = require('crypto');
const URL = require('./models/url.js');
const { URL: NodeURL } = require('url');
const { hostname } = require('os');



app.use(express.json());

//Connection to DB
mongoose.connect(process.env.MONGODB_URI);
  try {
    console.log('Successfully connected to MongoDB');
  }
  catch(error) {
    console.error('MongoDB connection error:', error)
  };


//function to generate shortened URL
// function generateShortUrl(url) {
//   return crypto.createHash('md5').update(url).digest('hex').slice(0, 8);
// }

//mock db to store the urls in
// const urlDatabase = {};


//routing
app.post('/api/shorturl', bodyParser.urlencoded({extended: false}), async (req, res) => {
  const { url } = req.body;
  console.log('Received URL:', url);

  if (!url) {
    return res.json({ error: 'invalid url' });
  }
  
  try {
    // First validate URL format
    let hostname;
    try {
      hostname = new NodeURL(url).hostname;
      console.log('Hostname extracted:', hostname);
    } catch(err) {
      console.log('Invalid URL format:', err);
      return res.json({ error: 'invalid url' });
    }

    // Wrap DNS lookup in a promise to properly await it
    try {
      await new Promise((resolve, reject) => {
        dns.lookup(hostname, (err) => {
          if (err) {
            console.log('DNS lookup failed:', err);
            reject(err);
          } else {
            console.log('DNS lookup successful');
            resolve();
          }
        });
      });
    } catch(err) {
      return res.json({ error: 'invalid url' });
    }

    // If we get here, URL is valid and domain exists
    const existingUrl = await URL.findOne({ original_url: url });
    if (existingUrl) {
      console.log(`A short_url already exists for ${existingUrl.original_url}.`);
      return res.json({
        original_url: existingUrl.original_url,
        short_url: existingUrl.short_url
      });
    }

    let short_url;
    do {
      short_url = Math.floor(10000 + Math.random() * 90000);
    } while (await URL.findOne({ short_url }));

    const newUrl = new URL({
      original_url: url,
      short_url: short_url
    });

    await newUrl.save();
    res.json({
      original_url: url,
      short_url: short_url
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Error saving to database' });
  }
});
  

app.get('/api/shorturl/:short_url', async (req, res) => {
  const { short_url } = req.params;
  console.log('Received GET request with short_url:', short_url);

  try {
    //query MongoDB to find the document with matching short_url
    const urlData = await URL.findOne({ short_url: short_url });
    console.log('MongoDB Query Result:', urlData);

    if (urlData) {
      console.log(urlData.original_url);
      res.redirect(urlData.original_url);
    } else {
      res.status(404).json({ error: 'URL not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error'});
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

