var bodyParser = require('body-parser');
var UserController = require('./controllers/UserController');
var PlanController = require('./controllers/PlanController');
var https = require('https');

// Routes
module.exports = function(app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(function(req, res, next) {
    res.locals.user = req.session.userId;
    res.locals.username = req.session.userName;
    next();
  });

  // General routes
  app.get('/', function(req, res) {
    if (req.session && req.session.userId) {
      res.render('home');
    } else {
      res.render('login');
    }
  });

  app.get('/help', function(req, res) {
    res.render('help');
  });

  app.get('/contact', function(req, res) {
    res.render('contact', {
      csrf: 'CSRF token here'
    });
  });

  app.get('/home', function(req, res) {
    if (req.session && req.session.userId) {
      res.render('home');
    } else {
      res.render('login');
    }
  });

  app.get('/plans_page', function(req, res) {
    if (req.session && req.session.userId) {
      res.render('plans_page');
    } else {
      res.render('info_page', {
        data: 'You must be logged in to view this page. Back to ',
        name: 'login',
        link: 'login_page'
      });
    }
  });


    app.get('/search', function(req, res) {
        if (req.session && req.session.userId) {
            res.render('search');
        } else {
            res.render('info_page', {
                data: 'You must be logged in to view this page. Back to ',
                name: 'login',
                link: 'login_page'
            });
        }
    });
  app.get('/rate/:id', function(req, res){
    if(req.session && req.session.userId){
      res.render('rate', {id: req.params.id});
    }
  });

  app.get('/feedback/:id', function(req, res){
    if(req.session && req.session.userId){
      res.render('feedback', {id: req.params.id});
    }
  });

  app.get('/chat_app/:id', function(req, res){
    if(req.session && req.session.userId){
      res.render('chat_app', {id: req.params.id});
    }
    else{
      res.render('home');
    }

  });

    // app.use('/price_estimate/', function(req, res){
    //     if(req.session && req.session.userId){
    //         var option = {
    //             hostname: 'api.uber.com',
    //             port: 443,
    //             path: '/v1.2/estimates/price?start_latitude=37.7752315&start_longitude=-122.418075&end_latitude=37.7752415&end_longitude=-122.518075&access_token=KA.eyJ2ZXJzaW9uIjoyLCJpZCI6IlNNTmtrVzdVVGtHY1RwUDNUbXY5NUE9PSIsImV4cGlyZXNfYXQiOjE1MjYwMTUwMzAsInBpcGVsaW5lX2tleV9pZCI6Ik1RPT0iLCJwaXBlbGluZV9pZCI6MX0.i_k-F_Qf4YdStWWxTVQ-KFjaQsc4OXvKvMEEajt1wmQ',
    //             method: 'get'
    //         };
    //
    //         let req = https.request(option, function (res) {
    //             var uberData = '';
    //             res.on('data', function (chunk) {
    //                 uberData = uberData + chunk;
    //             });
    //             res.on('end', function() {
    //                 // console.log(uberData);
    //                 console.log(JSON.parse(uberData));
    //             });
    //         });
    //
    //         req.end('data', function() {
    //             next();
    //         });
    //         res.render('price_estimate', {id: req.params.id});
    //     }
    // });
  app.get('/register_page', function(req, res) {
    res.render('register');
  });
    //
    // app.use('/price_estimate', function(reqs, rest, next) {
    //     console.log(reqs.body);
        // console.log('reqs.body');
        // var option = {
        //     hostname: 'api.uber.com',
        //     port: 443,
        //     path: '/v1.2/estimates/price?start_latitude=37.7752315&start_longitude=-122.418075&end_latitude=37.7752415&end_longitude=-122.518075&access_token=KA.eyJ2ZXJzaW9uIjoyLCJpZCI6IlNNTmtrVzdVVGtHY1RwUDNUbXY5NUE9PSIsImV4cGlyZXNfYXQiOjE1MjYwMTUwMzAsInBpcGVsaW5lX2tleV9pZCI6Ik1RPT0iLCJwaXBlbGluZV9pZCI6MX0.i_k-F_Qf4YdStWWxTVQ-KFjaQsc4OXvKvMEEajt1wmQ',
        //     method: 'get'
        // };
        //
        // let req = https.request(option, function (res) {
        //     var uberData = '';
        //     res.on('data', function (chunk) {
        //         uberData = uberData + chunk;
        //     });
        //     res.on('end', function() {
        //         // console.log(uberData);
        //         console.log(JSON.parse(uberData));
        //         // rest.render('home');
        //         next();
        //     });
        // });

        // req.end('', function() {
        //     rest.render('price_estimate');
        // });
    // });

  // Routes related to Plan
  app.post('/savePlan', PlanController.savePlan);
  app.post('/searchPlan', PlanController.searchPlan);
  app.post('/joinPlan', PlanController.joinPlan);
  app.post('/rate_users', PlanController.rate_users);
  app.post('/add_feedback', PlanController.add_feedback);
  app.get('/get_plans', PlanController.getPlans);
  app.get('/get_trip_users/:id', PlanController.get_trip_users);
  app.get('/delete/:id', PlanController.deletePlan);
  app.get('/edit/:id', PlanController.editPlan);
  app.get('/get_plan/:id', PlanController.get_plan);
  app.get('/price_estimate/:id', PlanController.getEstimate);
  app.get('/getPrice/', PlanController.getEstimatedPrice);
  // Routes related to User
  app.get('/verify_user/:email/:verfhash', UserController.verifyUser);
  app.get('/login_page', function(req, res) {
    res.render('login');
  });
  app.get('/logout_page', UserController.logoutUser);
  app.get('/info_page', function(req, res) {
    res.render('info_page', {
      data: 'Welcome. Click here to  ',
      name: 'login',
      link: 'login_page'
    });
  });
  app.post('/profile_page', UserController.updateProfile);
  app.post('/createUser', UserController.createUser);
  app.post('/loginUser', UserController.loginUser);
  app.get('/profile_page', UserController.getProfile);

// routes related to chat
//  app.post('/add_chat/:trip_id', PlanController.tripChat);
  app.post('/addChat/', PlanController.addMessage);
  app.post('/Chat_Room/:id', PlanController.tripChat);
};
