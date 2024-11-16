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
app.post('/api/shorturl', bodyParser.urlencoded({extended: false }), async (req, res) => {
  const { url } = req.body;

  if (!url) {
    console.log('Error: URL not provided');
    return res.status(400).json({ error: 'invalid url' });
  }
  
  try {
    //verify url is valid with dns.lookup
    


      //check to see if url already exists in db
     const existingUrl = await URL.findOne({ original_url: url });
    
     //if short_Url does exist, return the existingUrl in json format
     if (existingUrl) {
      console.log(`A short_url already exists for ${existingUrl.original_url}.`);
      return res.json({
        original_url: existingUrl.original_url,
        short_url: existingUrl.short_url
      });
    };

      //generate a random 5-digit short numeric URL code if it does not exist
      let short_url;
      do {
        short_url = Math.floor(10000 + Math.random() * 90000);
      } while (await URL.findOne({ short_url }));

    //create a new URL docuemnt and save it
    const newUrl = new URL({
      original_url: url,
      short_url: short_url
    });

    await newUrl.save(); //push data to MongoDB

    //respond with the shortened URL info
    res.json({
      original_url: url,
      short_url: short_url
    });
  } catch (error) {
    console.error(error);
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

