const express = require("express");

const app = express();

module.exports = app;

const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

let dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,

      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server has started");
    });
  } catch (e) {
    console.log(`DbError: ${e.message}`);

    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

//API GET ALL PLAYERS

app.get("/players/", async (request, response) => {
  try {
    const getPlayerDetailsQuery = `select
    *
    from player_details;
   `;

    let playersArray = await db.all(getPlayerDetailsQuery);

    response.send(
      playersArray.map((eachplayer) =>
        convertPlayerDbObjectToResponseObject(eachplayer)
      )
    );
  } catch (e) {
    console.log(e.message);
  }
});

//API GET A PLAYER

app.get("/players/:playerId", async (request, response) => {
  try {
    const { playerId } = request.params;
    const getPlayerDetailsQuery = `select
    *
    from player_details
    where player_id = ${playerId}
   `;

    let playersArray = await db.get(getPlayerDetailsQuery);

    response.send(convertPlayerDbObjectToResponseObject(playersArray));
  } catch (e) {
    console.log(e.message);
  }
});

//API UPDATE PLAYER DETAILS

app.put("/players/:playerId", async (request, response) => {
  try {
    const { playerId } = request.params;
    const { playerName } = request.body;
    const updatePlayerDetailsQuery = `
    update player_details
    set player_name = '${playerName}'
    where player_id = ${playerId}
   `;

    await db.run(updatePlayerDetailsQuery);

    response.send("Player Details Updated");
  } catch (e) {
    console.log(e.message);
  }
});

//API GET A MATCH DETAILS

app.get("/matches/:matchId", async (request, response) => {
  try {
    const { matchId } = request.params;
    const getMatchDetailsQuery = `select
    *
    from match_details
    where match_id = ${matchId}
   `;

    let matchArray = await db.get(getMatchDetailsQuery);

    response.send(convertMatchDbObjectToResponseObject(matchArray));
  } catch (e) {
    console.log(e.message);
  }
});

//API GET PLAYER MATCHES

app.get("/players/:playerId/matches", async (request, response) => {
  try {
    const { playerId } = request.params;
    const getMatchesDetailsQuery = `select
    match_id,
    match,
    year
    from player_match_score
    natural join match_details
    where player_id = ${playerId}
   `;

    let matchesArray = await db.all(getMatchesDetailsQuery);
    console.log(matchesArray);

    response.send(
      matchesArray.map((match) => {
        return convertMatchDbObjectToResponseObject(match);
      })
    );
  } catch (e) {
    console.log(e.message);
  }
});

//API GET PLAYERS SCORES

app.get("/players/:playerId/playerScores", async (request, response) => {
  try {
    const { playerId } = request.params;
    const getScoreDetailsQuery = `select
    player_id,
    player_name,
    sum(score) as score,
    sum(fours) as fours,
    sum(sixes) as sixes
    from player_match_score
    natural join player_details
    where player_id = ${playerId}
    group by player_id
   `;

    let scoreArray = await db.get(getScoreDetailsQuery);

    response.send({
      playerId: scoreArray.player_id,
      playerName: scoreArray.player_name,
      totalScore: scoreArray.score,
      totalFours: scoreArray.fours,
      totalSixes: scoreArray.sixes,
    });
  } catch (e) {
    console.log(e.message);
  }
});
