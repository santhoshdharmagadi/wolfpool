var express = require('express');
var app = express();
var https = require('https');
var bodyParser = require('body-parser');
var session = require('express-session');
var handlebars = require('express-handlebars');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);
var expressValidator = require('express-validator');
var geolib = require('geolib');
var cors = require('cors');
var Uber = require('node-uber');

// var uber = new Uber({
//     client_id: 'IO8DrxU4a09RW9f_1_sWAvH1QSSvgjeu',
//     client_secret: 'uvspz0J3JtbZj0hcDOn4GGWdHsdxSPSj53ruWDVQ',
//     server_token: '3jAnZxvwYgZhKENLLQOLi_G1pxBHnBGtQfnoz-Wr',
//     redirect_uri: 'MY_REDIRECT_URI',
//     name: 'wolfpool',
//     language: 'en_US', // optional, defaults to en_US
//     sandbox: true, // optional, defaults to false
// });

// Database code
mongoose.connect('mongodb://152.46.18.168:27017/wolfpool');
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Handlebar Code
handlebars = handlebars.create({
  defaultLayout: 'main'
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// Session related for tracking logins
app.use(session({
  secret: 'SENG',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    // mongooseConnection: db https://github.com/jdesboeufs/connect-mongo/issues/277
    url: 'mongodb://152.46.18.168:27017/wolfpool'
  })
}));

// App configuration
app.disable('x-powered-by');
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));

app.use(expressValidator());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.post('/price_estimate', function(reqs, res) {
    console.log(reqs.body);
    var option = {
        hostname: 'api.uber.com',
        port: 443,
        path: '/v1.2/estimates/price?start_latitude=37.7752315&start_longitude=-122.418075&end_latitude=37.7752415&end_longitude=-122.518075&access_token=KA.eyJ2ZXJzaW9uIjoyLCJpZCI6IlNNTmtrVzdVVGtHY1RwUDNUbXY5NUE9PSIsImV4cGlyZXNfYXQiOjE1MjYwMTUwMzAsInBpcGVsaW5lX2tleV9pZCI6Ik1RPT0iLCJwaXBlbGluZV9pZCI6MX0.i_k-F_Qf4YdStWWxTVQ-KFjaQsc4OXvKvMEEajt1wmQ',
        method: 'get'
    };

    let req = https.request(option, function (res) {
        var uberData = '';
        res.on('data', function (chunk) {
            uberData = uberData + chunk;
        });
        res.on('end', function() {
            // console.log(uberData);
            console.log(JSON.parse(uberData));
            app.render('price_estimate', {resp: '123'});
        });
    });

    req.end();
});



// send app to router
require('./router')(app);

app.listen(app.get('port'), function() {
  console.log('Express started on http://localhost:' + app.get('port') + ' press Ctrl-C to terminate');
});
