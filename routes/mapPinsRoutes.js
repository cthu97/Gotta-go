const express = require('express');
const router = express.Router();

module.exports = (db) => {
  //retrieve pins for specific map in database
  router.get("/:id", (req, res) => {
    const map_id = req.params.id;
    db.query(`SELECT pins.*
      FROM map_pins
      JOIN pins ON pins.id = pin_id
      WHERE map_id = $1;`, [map_id])
      .then(data => {
        const mapPins = data.rows;
        res.json(mapPins);
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  //add map
  router.post("/:map_id", (req, res) => {
    const map_id = req.params.map_id;
    const id = req.body;
    console.log('id from req.body id:', id.pinID);
    db.query(`INSERT INTO map_pins (map_id, pin_id) VALUES ($1, $2) RETURNING *;`, [map_id, id.pinID])
      .then(data => {
        const mapPins = data.rows[0];
        res
          .json(mapPins);
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message })
      })
  });

  //delete map
  router.delete("/:pin_id/:map_id", (req, res) => {
    const {pin_id, map_id} = req.params;
    console.log('inside route deleting', pin_id, map_id)
    db.query(`DELETE FROM map_pins WHERE pin_id = $1 AND map_id = $2;`, [pin_id, map_id])
      .then(data => {
        res.json(map_id);
      })
      .catch(err => {
        res
          .status(500)
          .json({ success: false, error: err });
      });
  });

  return router;
}
