const mongoose = require("mongoose");
const Event = require("./Event");

// For backward compatibility, export Event as Movie or map appropriately
module.exports = mongoose.models.Event || Event;