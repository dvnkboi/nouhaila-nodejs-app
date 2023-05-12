# Small project that uses JWT to authenticate users

## Installation

### Requirements
- Node.js https://nodejs.org/en/
- NPM https://www.npmjs.com/ (comes with Node.js)

### Setup 
1. use `npm install` to install dependencies
2. configure the database in the .env file as well as any parameters you want to change
3. create a user table in the database like so:
```sql
CREATE TABLE users (
    email varchar(30) NOT NULL PRIMARY KEY,
    password varchar(64) NOT NULL,
    name varchar(30) NOT NULL,
    age int NOT NULL,
    phone varchar(13) NOT NULL,
    privilege varchar(10) NOT NULL
);
```
4. use `npm start` to start the server, you should see the message `Server is running on port ${your_port}.`

## Usage
### Register
- go to `localhost:3000/` to start
- by changing the privilege type of a user in the database to `admin` you can access the admin page at `localhost:3000/admin/manage`