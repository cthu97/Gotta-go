/*
 * All routes for maps are defined here
 * Since this file is loaded in server.js into api/maps,
 *   these routes are mounted onto /maps
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const router = express.Router();

module.exports = (db) => {
  //retrieves all maps in database
  router.get("/", (req, res) => {
    db.query(`SELECT * FROM maps;`)
      .then(data => {
        const maps = data.rows;
        res.json({ maps });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  //retrieves single map via map id
  router.get("/:id", (req, res) => {
    const values = req.params.id;
    db.query(`SELECT * FROM maps WHERE maps.id = $1;`, [values])
      .then(data => {
        const maps = data.rows;
        res.json({ maps });
      })
      .catch(err => {
        res.status(500)
          .json({ error: err.message })
      })
  });

  //retrieves maps near location
  router.get("/:lat/:long", (req, res) => {
    const { lat, long } = req.params;
    const userLat = parseFloat(lat);
    const userLong = parseFloat(long);
    db.query(`SELECT *,  SQRT(POW(69.1 * (latitude::float -  ${userLat}::float), 2) +
    POW(69.1 * (${userLong}::float - longitude::float) * COS(latitude::float / 57.3), 2)) as distance
      FROM maps
      WHERE latitude < ${userLat + 1}
      AND latitude > ${userLat - 1}
      AND longitude < ${userLong + 1}
      AND longitude > ${userLong - 1}
      ORDER BY distance;`)

      .then(data => {
        const maps = data.rows;
        res.json({ maps })
      })
      .catch(err => {
        res.status(500)
          .json({ error: err.message })
      })
  });

  //get favourited maps
  router.get("/:id/favourited_maps", (req, res) => {
    const values = req.params.id;
    db.query(`SELECT * FROM favourited_maps
      JOIN maps ON maps.id = map_id
      JOIN users ON users.id = users.id
      WHERE user_id = $1;`, [values])
      .then(data => {
        const favorites = data.rows;
        res.json({ favorites });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  //edit map
  router.patch("/:id", (req, res) => {
    const values = req.params.id;
    const { name, area, creator_id } = req.body;
    const query = `UPDATE maps SET name = $1, area = $2 WHERE creator_id = $3 AND maps_id = $4 RETURNING *;`;
    db.query(query, [name, area, creator_id, values])
      .then(data => {
        const maps = data.rows;
        res.json({ maps });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });


  //add map
  router.post("/", (req, res) => {
    const { creator_id, name, latitude, longitude } = req.body;
    db.query(`INSERT INTO maps (creator_id, name, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *;`, [creator_id, name, latitude, longitude])
      .then(data => {
        const maps = data.rows[0];
        res
          .json({ maps });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message })
      })
  });

  //delete map
  router.delete("/:id", (req, res) => {
    const values = req.params.id;
    db.query(`DELETE FROM maps WHERE id = $1;`, [values])
      .then(data => {
        res.json({ success: true });
      })
      .catch(err => {
        res
          .status(500)
          .json({ success: false, error: err });
      });
  });


  return router;
};



