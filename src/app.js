const express = require("express");
const NodeCache = require("node-cache");
const path = require("path");
const viewsPath = path.join(__dirname, "../templates/views");
//The data will stay 100 seconds in the cache
const myCache = new NodeCache({ stdTTL: 100 });
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;
const homeUrl = "http://localhost:3000";

// Setup handlebars engine and views
app.set("view engine", "hbs");
app.set("views", viewsPath);

// Load the index.hbs page
app.get("", (req, res) => {
  res.render("index.hbs");
});

app.listen(port, () => {
  console.log("Server is up on port " + port);
});

// Get the details for the movie inputed in the index page
app.get("/movieSearch", async (req, res) => {
  var movieTitle = req.query.search;

  if (!movieTitle) {
    return res.send({
      error: "Please specify a valid movie title or suggestion",
      home: homeUrl,
    });
  }

  //It is not good practice to hardcode the API key, but I did it to make the testing of the application easier
  const API_KEY = "feb6f0eeaa0a72662967d77079850353";

  //Check if the movie title is in the cache, if it is we retrive the data.
  if (myCache.has(movieTitle)) {
    res.send({
      home: homeUrl,
      results: myCache.get(movieTitle),
    });
  } else {
    //Concatenate the API request url to get the movie details for the inputed movie title
    var url =
      "https://api.themoviedb.org/3/search/movie?query=" +
      movieTitle +
      "&api_key=" +
      API_KEY +
      "&page=1";

    //Send a get request
    const moviesResponse = await axios.get(url);
    var movies = moviesResponse.data.results;

    for (let i = 0; i < movies.length; i++) {
      //Concatenate the API request url to get the videos for the inputed movie title
      const trailersUrl =
        "https://api.themoviedb.org/3/movie/" +
        movies[i].id +
        "/videos?api_key=" +
        API_KEY +
        "&language=en-US";

      const trailerResponse = await axios.get(trailersUrl);
      var trailersData = trailerResponse.data.results;

      //Search the videos data to find the desired movie trailer
      for (const trailerData of trailersData) {
        //Get the video that has the official trailer and break after the first find
        if (trailerData.type === "Trailer" && trailerData.official === true) {
          movies[i].trailer =
            "https://www.youtube.com/watch?v=" + trailerData.key;
          break;
        }
      }
    }

    //Store the movie title and the movie details in the cache
    myCache.set(movieTitle, movies);
    res.send({
      home: homeUrl,
      results: movies,
    });
  }
});
