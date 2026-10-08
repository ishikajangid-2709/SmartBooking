const eventController = require("./eventController");

module.exports = {
  addMovie: eventController.createEvent,
  getMovies: eventController.getEvents,
  getMovieById: eventController.getEventById,
  deleteMovie: eventController.deleteEvent,
};