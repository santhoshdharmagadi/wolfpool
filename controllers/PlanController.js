var geolib = require('geolib');
var haversine = require('haversine-distance');
var Plan = require('../models/plan');
var Rating = require('../models/rating');
var Feedback = require('../models/feedback');
let Chat = require('../models/chat');
var Splitwise = require('../models/Splitwise');

var checker = 0;

exports.savePlan = function (request, response) {
  console.log(request.body);
  if (checker != 1) {
    var planModel = require('../models/plan')
    var planData = new planModel({
      source_id: request.body.source,
      destination_id: request.body.destination,
      source_lat: request.body.lat[0],
      source_long: request.body.lng[0],
      dest_lat: request.body.lat[1],
      dest_long: request.body.lng[1],
      date: request.body.date,
      time: request.body.time,
      no_of_people: request.body.no_of_people,
      vacancy: 6 - request.body.no_of_people,
      emails: [request.session.userEmail],
      gender_preference: request.body.gender_preference,
      luggage: request.body.luggage,
      minimum_rating: request.body.minimum_rating,
      maximum_coPassengers: request.body.maximum_coPassengers,
      people_per_email: [{ "email": request.session.userEmail, "passengers": Number(request.body.no_of_people) }],
    });
    planData.save()
      .then(item => {
        response.render('plans_page');
      })
      .catch(err => {
        console.log(err);
        response.render('info_page', {
          data: "Unable to create plan."
        });
      });
  } else {
    response.render('info_page', {
      data: "Similar plans already exists. Please join existing plans."
    });
  }
};


exports.getPlans = function (request, response) {
  Plan.find({
    "emails": request.session.userEmail
  }, function (err, planslist) {
    response.send(planslist);
  });
};

exports.get_trip_users = function (request, response) {
  Plan.findOne({
    "_id": request.params.id
  }, function (err, plan) {
    var record = {
      "plan": plan,
      "myEmail": request.session.userEmail
    };
    // console.log(record);
    response.send(record);
  });

};

exports.rate_users = function (request, response) {
  var rating = [];

  for (var email in request.body) {
    if (email != 'id') {
      rating.push({
        "trip_id": request.body.id,
        "source_email": request.session.userEmail,
        "destination_email": email,
        "rating": Number(request.body[email])
      });
    }
  }

  Rating.create(rating, function (err, result) {
    if (err) {
      response.status(400).send(err);
    } else {
      response.render('plans_page');
    }
  });
};

exports.add_feedback = function (request, response) {
  var feedback = [];

  for (var email in request.body) {
    if (email != 'id') {
      feedback.push({
        "trip_id": request.body.id,
        "source_email": request.session.userEmail,
        "destination_email": email,
        "feedback": request.body[email]
      });
    }
  }

  Feedback.create(feedback, function (err, result) {
    if (err) {
      response.status(400).send(err);
    } else {
      response.render('plans_page');
    }
  });
};

exports.deletePlan = function (request, response) {
  if (request.session && request.session.userEmail) {
    Plan.findById(request.params.id, function (err, plan) {
      if (err) {
        response.status(400).send(err);
      } else {
        var details = plan.people_per_email.filter(function (el) {
          return el.email == request.session.userEmail;
        });
        plan.no_of_people = plan.no_of_people - details[0].passengers;
        plan.vacancy = 6 - plan.no_of_people;
        plan.people_per_email = plan.people_per_email.filter(function (el) {
          return el.email != request.session.userEmail;
        });
        plan.emails = plan.emails.filter(function (el) {
          return el != request.session.userEmail;
        })

        if (plan.emails.length == 0) {
          Plan.findByIdAndRemove(plan._id, (err, plan) => {
            if (err) {
              response.render('404');
            } else {
              response.render('plans_page');
            }
          });
        } else {
          plan.save(function (err) {
            if (err) {
              response.render('404');
            } else {
              response.render('plans_page');
            }
          });
        }
      }
    });
  }
}

exports.editPlan = function (request, response) {
  if (request.session && request.session.userEmail) {
    Plan.findById(request.params.id, function (err, plan) {
      if (err) {
        response.status(400).send(err);
      } else {
        var details = plan.people_per_email.filter(function (el) {
          return el.email == request.session.userEmail;
        });
        plan.no_of_people = plan.no_of_people - details[0].passengers;
        plan.vacancy = 6 - plan.no_of_people;
        plan.people_per_email = plan.people_per_email.filter(function (el) {
          return el.email != request.session.userEmail;
        });
        plan.emails = plan.emails.filter(function (el) {
          return el != request.session.userEmail;
        })

        if (plan.emails.length == 0) {
          Plan.findByIdAndRemove(plan._id, (err, plan) => {
            if (err) {
              response.render('404');
            } else {
              response.render('edit_page', { id: plan });
            }
          });
        } else {
          plan.save(function (err) {
            if (err) {
              response.render('404');
            } else {
              response.render('edit_page', { id: plan });
            }
          });
        }


      }
    });
  }
};

exports.get_plan = function (request, response) {
  if (request.session && request.session.userEmail) {
    Plan.findById(request.params.id, function (err, plan) {
      if (err) {
        response.render('404');
      } else {
        console.log(request.params.id);
        console.log("Plan -> " + plan);
        response.send(plan);
      }
    });
  }
};

exports.joinPlan = function (request, response) {

  var planId = request.body.selectedPlan;
  var numberOfPeople = request.body.numberOfPeople;

  Plan.findById(planId, function (err, plan) {
    if (err) {
      response.status(500).send("The plan you selected got full. Please search again.");
    } else {
      plan.emails.push(request.session.userEmail);
      plan.people_per_email.push({ "email": request.session.userEmail, "passengers": numberOfPeople });
      plan.no_of_people = +plan.no_of_people + +numberOfPeople;
      plan.vacancy = +plan.vacancy - +numberOfPeople;
      plan.save();

      // Send email to users in list that current user joined plan
      var emails = [];
      var emails_for_mail = "";
      plan.emails.forEach(function (email) {
        emails.push({
          'Email': email
        });
        emails_for_mail += " " + email
      });
      console.log(emails);
      // Configure the api
      var mailjet = require('node-mailjet').connect(process.env.MJ_PUBLIC_KEY, process.env.MJ_PRIVATE_KEY)

      var mj_req = mailjet
        .post("send")
        .request({
          "FromEmail": "sengncsu2018@gmail.com",
          "FromName": "Wolfpool Support",
          "Subject": 'Someone just joined your wolfpool plan!',
          "Html-part": 'Hi there! ' + request.session.userName + ' just joined your trip with details listed below. Following are the email addresses of everyone in the plan: ' + emails_for_mail + '.<br/><br/>Trip details:<br/>Source: ' + plan.source_id + '<br/>Destination: ' + plan.destination_id + '<br/>Date: ' + (plan.date.getMonth() + 1) + '/' + plan.date.getDate() + '/' + plan.date.getFullYear() + '<br/>Time(24 hr format): ' + plan.time,
          "Recipients": emails
        });

      mj_req
        .then((result) => {
          return res.render('info_page', {
            data: 'An email notification has been to your trip buddies.'
          });
        })
        .catch((err) => {
          console.log(err.statusCode)
        })

      response.setHeader('Content-Type', 'application/text');
      response.send("/plans_page");
    }
  });

}

exports.searchPlan = function (request, response) {

  // Show all existing plans that the user can join, along with an option to create
  checker = 0;
  userRequest = request.body
  // console.log(userRequest)

  var currSrc = {
    lat: userRequest.lat[0],
    lng: userRequest.lng[0]
  };
  var currDest = {
    lat: userRequest.lat[1],
    lng: userRequest.lng[1]
  };
  var query = {
    "date": {
      $eq: userRequest.date
    },
    "time": {
      $eq: userRequest.time
    },
    "emails": {
      $ne: request.session.userEmail
    },
    "vacancy": {
      $gte: userRequest.no_of_people
    }
  }; //Change to vacancy - no_of_people

  Plan.find(query, (err, plans) => {
    if (err) {
      response.status(500).send(err);
    } else {
      console.log("found " + plans.length);
      var temp = [];
      for (var i = 0; i < plans.length; i++) {
        var optionSrc = {
          lat: plans[i].source_lat,
          lng: plans[i].source_long
        };
        var optionDest = {
          lat: plans[i].dest_lat,
          lng: plans[i].dest_long
        };

        if (haversine(currSrc, optionSrc) < 2000 && haversine(currDest, optionDest) < 2000) {
          plans[i].src_distance = Math.round(haversine(currSrc, optionSrc) * 0.000621371 * 100) / 100; //to calculate the distance in miles
          plans[i].dest_distance = Math.round(haversine(currDest, optionDest) * 0.000621371 * 100) / 100; //to calculate the distance in miles
          temp.push(plans[i]);
          checker = 1;
        }
      }

      var results = [];
      var match0 = [];
      var match1 = [];
      var match2 = [];
      var match3 = [];
      var match4 = [];

      if (checker == 1) {
        var count = 0;
        for (var i = 0; i < temp.length; i++) {
          if (temp[i].gender_preference == userRequest.gender_preference) {
            count = count + 1;
          }
          if (temp[i].luggage == userRequest.luggage) {
            count = count + 1;
          }
          if (temp[i].no_of_people <= userRequest.maximum_coPassengers) {
            count = count + 1;
          }
          if (count == 4) {
            match4.push(temp[i]);
          }
          if (count == 3) {
            match3.push(temp[i]);
          }
          if (count == 2) {
            match2.push(temp[i]);
          }
          if (count == 1) {
            match1.push(temp[i]);
          }
          if (count == 0) {
            match0.push(temp[i]);
          }

        }

        for (var i = 0; i < match4.length; i++) {
          results.push(match4[i]);
        }

        for (var i = 0; i < match3.length; i++) {
          results.push(match3[i]);
        }

        for (var i = 0; i < match2.length; i++) {
          results.push(match2[i]);
        }

        for (var i = 0; i < match1.length; i++) {
          results.push(match1[i]);
        }

        for (var i = 0; i < match0.length; i++) {
          result.push(match0[i]);
        }
      }


      // console.log("*********result "+results);
      response.setHeader('Content-Type', 'application/json');
      response.send(JSON.stringify(results));

    }
  });
};

var https = require('https');
var uberData = '';
var lyftData = '';
var prices = {};
var item = {};
exports.getEstimate = function (request, response) {
  uberData = '';
  lyftData = '';
  item = {};
  console.log('is it entering here');
  console.log(request.params.id);
  return new Promise(function (resolve) {
    Plan.findOne({ "_id": request.params.id }, function (err, plan) {
      var record = {
        "plan": plan,
        "myEmail": request.session.userEmail
      };
      resolve(record);
    });
  }).then(function (res) {
    item = res.plan;
    console.log(item);
    return new Promise(function (resolve, reject) {
      var uberURL = {
        hostname: 'api.uber.com',
        port: 443,
        path: '/v1.2/estimates/price?' +
          `start_latitude=${parseFloat(res.plan.source_lat)}&start_longitude=${parseFloat(res.plan.source_long)}&end_latitude=${parseFloat(res.plan.dest_lat)}&end_longitude=${parseFloat(res.plan.dest_long)}&access_token=KA.eyJ2ZXJzaW9uIjoyLCJpZCI6IlNNTmtrVzdVVGtHY1RwUDNUbXY5NUE9PSIsImV4cGlyZXNfYXQiOjE1MjYwMTUwMzAsInBpcGVsaW5lX2tleV9pZCI6Ik1RPT0iLCJwaXBlbGluZV9pZCI6MX0.i_k-F_Qf4YdStWWxTVQ-KFjaQsc4OXvKvMEEajt1wmQ`,
        method: 'get'
      };
      var req = https.get(uberURL, function (res) {
        console.log('ppp');
        res.on('data', function (chunk) {
          uberData = uberData + chunk;
        });
        // res.on('end', () => resolve(JSON.stringify({data: JSON.parse(uberData), item: item})));
        res.on('end', () => resolve(''));
        req.on('error', reject);
        req.end();
      });
    }).then(function (respons) {
      var lyftURL = {
        hostname: 'api.lyft.com',
        port: 443,
        path: `/v1/cost?start_lat=${parseFloat(res.plan.source_lat)}&start_lng=${parseFloat(res.plan.source_long)}&end_lat=${parseFloat(res.plan.dest_lat)}&end_lng=${parseFloat(res.plan.dest_long)}`,
        method: 'get'
      };
      // console.log('enter enter');
      return new Promise(function (resolve, reject) {
        var req = https.get(lyftURL, function (res) {
          res.on('data', function (chunk) {
            lyftData = lyftData + chunk;
          });

          res.on('end', () => resolve(JSON.stringify({
            uberData: JSON.parse(uberData),
            lyftData: lyftData === '' ? { data: 'null' } : JSON.parse(lyftData),
            item: item
          })));
          // res.on('end', () => resolve('dataa'));
          req.on('error', reject);
          req.end();
        });
      }).then(function (data) {
        // console.log(JSON.parse(resp));
        // prices = JSON.parse(resp);
        // console.log(uberData);
        // console.log('uberData');
        // console.log(lyftData);
        response.render('price_estimate', { resp: data });
      });
    });
  });
};

exports.getEstimatedPrice = function () {
  return new Promise(function (resolve) {
    return resolve(prices);
  });
};
exports.tripChat = function (request, response) {
  Chat.findOne({
    "trip_id": request.params.id
  }, function (err, chat_res) {
    if (err) {
      response.status(500).send("Invalid trip id. Please select other trip.");
    } else {
      // console.log("fetched to chat ");
      if (chat_res) {
        // console.log("chat pres");
        chat_res["myEmail"] = request.session.userEmail;
        console.log(chat_res);
        response.send(chat_res);
      }
      else {
        response.send({ no_message: "no chat right now, lets begin the conversation" });
      }
    }
  });
};

exports.addExpense = function (request, response) {
  splitwise = {
    "trip_id": request.body.trip_id,
    "total": Number(request.body.amount),
    "paid_by": request.body.paid_by
    // "splits": request.body.splits
  }

  var count = 1;
  for (var key in request.body) {
    // if (request.body.hasOwnProperty(key)) {
        if(request.body[key] == 'on'){
          // console.log(key + " -> " + request.body[key]);
          count += 1;
        }
    // }
  }

  // console.log("Count : " + count);
  // console.log(splitwise.total  +" / " + count + " = " + splitwise.total/count);
  var individualSplit = splitwise.total/count;
  var splits = [];
  for(var key in request.body){
    if(request.body[key] == 'on'){
      splits.push({
        email: key,
        owes: individualSplit
      });
    }
  }

  splitwise.splits = splits;
  // response.send(splitwise);

  Splitwise.create(splitwise, function (err, result) {
    if (err) {
      response.status(400).send(err);
    } else {
      response.render('Splitwise', {id: request.body.trip_id, split: result});
    }
  });

};

exports.fetch_splits = function (request, response){
  console.log(request.body.trip_id);
  Splitwise.findOne({"trip_id": request.body.trip_id}, function(err, split_res) {
      if(err){
        response.status(500).send("Invalid trip id. Please select other trip.");
      } else {
        if(split_res){
          response.send(split_res);
        } else{
          response.status(400).send({no_data:"No data as of now"});
        }
      }
  });
}

exports.addMessage = function (request, response) {
  Chat.findOne({ "trip_id": request.body.trip_id }, function (err, chat_res) {
    if (err) {
      response.status(500).send("Invalid trip id. Please select other trip.");
    } else {
      mychat = { "user_email": request.session.userEmail, "message": request.body.message };
      // console.log("YOlo");
      if (chat_res) {
        // console.log("Yo!");
        chat_res.chat.push(mychat);
        chat_res.save(function (err) {
          if (err) {
            response.render('404');
          } else {
            // console.log("Harsha");
            response.render('chat_app', { "id": chat_res.trip_id });
          }
        });
      } else {
        new_chat = { "trip_id": request.body.trip_id, "chat": [mychat] };
        Chat.create(new_chat, function (err, result) {
          if (err) {
            response.status(400).send(err);
          } else {
            // console.log("created chat "+result);
            response.render('chat_app');
          }
        });
      }
    }
  });
};

    // uberData = '';
    // console.log('111');
    // console.log(request.params.id);
    // Plan.findById(request.params.id, function(err, plan){
    //   if (!err) {
    //       var option = {
    //           hostname: 'api.uber.com',
    //           port: 443,
    //           path: '/v1.2/estimates/price?start_latitude=37.7752315&start_longitude=-122.418075&end_latitude=37.7752415&end_longitude=-122.518075&access_token=KA.eyJ2ZXJzaW9uIjoyLCJpZCI6IlNNTmtrVzdVVGtHY1RwUDNUbXY5NUE9PSIsImV4cGlyZXNfYXQiOjE1MjYwMTUwMzAsInBpcGVsaW5lX2tleV9pZCI6Ik1RPT0iLCJwaXBlbGluZV9pZCI6MX0.i_k-F_Qf4YdStWWxTVQ-KFjaQsc4OXvKvMEEajt1wmQ',
    //           method: 'get'
    //       };
    //
    //       let req = https.request(option, function (res) {
    //           console.log('ppp');
    //           res.on('data', function (chunk) {
    //               uberData = uberData + chunk;
    //           });
    //           res.on('end', function () {
    //               console.log(JSON.parse(uberData));
    //               console.log('111111');
    //               response.render('home');
    //           });
    //       });
    //       console.log(plan);
    //   }
    // });


    // req.end();
    //
    // req.end('', function() {
    //     rest.render('price_estimate');
    // });
    // });
// };
    // app.post('/price_estimating', function(req, rest) {
    //     console.log('is it entering here');
    //
    // });

// };

