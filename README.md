# Gotta Go
#### Created by: [Sylas Serné](https://github.com/sylastheodor), [Catherine Hu](https://github.com/cthu97), [Lawrence Lin](https://github.com/lawwwlin)

Gotta Go is an application that displays nearby washrooms. Users can create user defined map, and add or remove pins from the map. 

It uses the Leaflet.js API to add, remove pins and render the map.

## Tech Stack
* Node.JS
* Express
* Leaflet.js
* EJS
* PosgreSQL
* JQuery
* AJAX
* HTML
* (S)CSS

## Getting Started

1. Create the `.env` by using `.env.example` as a reference: `cp .env.example .env`
2. Update the .env file with your correct local information 
  - username: `labber` 
  - password: `labber` 
  - database: `midterm`
3. Install dependencies: `npm i`
4. Fix to binaries for sass: `npm rebuild node-sass`
5. Reset database: `npm run db:reset`
7. Run the server: `npm run local`
8. Visit `http://localhost:8080/`

## Final Product

![Home Page](https://github.com/cthu97/Gotta-go/blob/master/screenshots/home.png)

![Map](https://github.com/cthu97/Gotta-go/blob/master/screenshots/map.png)

## Dependencies

- Node 10.x or above
- NPM 5.x or above
- PG 6.x
