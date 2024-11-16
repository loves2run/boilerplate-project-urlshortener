const mongoose = require('mongoose');
const { Schema } = mongoose;

const urlSchema = new Schema({
    original_url: {type: String, required: true},
    short_url: {type: String, require: true, uniqu: true}
});

// const URL = mongoose.model('URL', urlSchema);


module.exports = mongoose.model('URL', urlSchema);


//