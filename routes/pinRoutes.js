const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get("/", (req, res) => {
    const values = req.params.id;
    db.query(`SELECT * FROM pins;`)
      .then(data => {
        const pins = data.rows;
        res
            .json({ pins });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      })
  })

  router.get("/:id", (req, res) => {
    const values = req.params.id;
    db.query(`SELECT * FROM pins WHERE id = $1;`, [values])
      .then(data => {
        const pins = data.rows;
        res
          .json({ pins });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message })
      })
  })


  //add pins
  router.post("/", (req, res) => {
    const { creator_id, title, description, latitude, longitude, image_url, map_id} = req.body;
    console.log(`post called /api/pins/ posted data: ${req.body.title}`)
    db.query(`INSERT INTO pins (creator_id, title, description, latitude, longitude, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`, [creator_id, title, description, latitude, longitude, image_url])
      .then(data => {
        const pin = data.rows;
        console.log(`/api/pins/ posted data:`, data)
        console.log(`/api/pins/ posted data:`, pin)
        res
          .json({pin, map_id});
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message })
      })
  })

  //edit pins
  router.patch("/:id", (req, res) => {
    const values = req.params.id;
    const { user_id, title, description, latitude, longitude, image } = req.body; //add in user_rating(stretch)

    //only creator can edit
    if (user_id === pins.user_id) {
      db.query(`UPDATE pins SET title = $1, description = $2, latitude = $3, longitude = $4, image = $5 WHERE map_id = $6 RETURNING *;`, [title, description, latitude, longitude, image, values])
        .then(data => {
          const pins = data.rows;
          res.json({ pins })
        })
        .catch(err => {
          res
            .status(500)
            .json({ error: err.message });
        })
    } else {
      res.send('Error: User not Authorized.')
    }
  })

  //delete pins
  router.delete("/:id", (req, res) => {
    const values = req.params.id;
    db.query(`DELETE FROM pins WHERE id = $1;`, [values])
      .then(data => {
        res
          .json({ success: true })
      })
      .catch(err => {
        res
          .status(500)
          .json({ success: false, error: err })
      })
  })

  return router;
};
