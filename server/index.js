const express = require('express');
const bodyParser = require('body-parser');
const router = require('./router.js');

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/router', router.router);

app.listen(3000, async () => {
    console.log('Listening on port 3000!');
    await router.init2();
});