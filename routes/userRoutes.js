/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require("express");
const router = express.Router();

module.exports = (db) => {
  //retrieve all users
  router.get("/", (req, res) => {
    const user_id = req.session.user_id;
    db.query(`SELECT * FROM users;`)
      .then(data => {
        const users = data.rows;
        res.json({ users, user_id });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // retrieve the current logged in user, if not logged in, return undefined
  router.get("/me", (req, res) => {
    if (!req.session.user_id) {
      return res.json({latitude: 49.260833, longitude: -123.113889});
    }
    const user_id = req.session.user_id;
    db.query(`SELECT * FROM users WHERE id = $1;`, [user_id])
      .then(data => {
        const user = data.rows[0];
        res.json(user);
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  //retrieve user's maps
  router.get("/:id", (req, res) => {
    const user_id = req.params.id;
    db.query(`SELECT users.id as user_id, username, password, users.latitude as user_lat, users.longitude as user_long, maps.id as map_id, creator_id, name as map_name, maps.latitude as map_lat, maps.longitude as map_long FROM users JOIN maps ON creator_id = users.id WHERE creator_id = $1;`, [user_id])
      .then(data => {
        const userData = data.rows;
        res.json({userData});
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  //edit user's location
  router.patch("/:id", (req, res) => {
    const user_id = req.params.id;
    const { latitude, longitude } = req.body;
    db.query(`UPDATE users SET latitude = $1, longitude = $2 WHERE id = $3 RETURNING *;`, [latitude, longitude, user_id])
      .then(data => {
        const userData = data.rows;
        res.json({userData});
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  return router;
};

