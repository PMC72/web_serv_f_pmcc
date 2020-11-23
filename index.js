//CCCS425 Final Project Part 1 - Patrick McClintock

// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors());

let bodyParser = require("body-parser");
app.use(bodyParser.raw({ type: "*/*" }));
let accounts = new Map();

let channels = new Map();
let ban = new Map();
let sessions = new Map();
let counters = new Map();
//unique number generated for token
let counter = 1;
let sessionid = () => {
  counter = counter + 1;
  return "token-" + counter;
};
//create and initialize array
var arrchannel = [];
arrchannel.length = 0;  

app.get("/sourcecode", (req, res) => {
  res.send(
    require("fs")
      .readFileSync(__filename)
      .toString()
  );
});

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

//acount creation
app.post("/signup", (req, res) => {
  let parsed = JSON.parse(req.body);
  let username = parsed.username;
  let password = parsed.password;
  let existuser = accounts.get(username);
  console.log("signup: " + username + " password: " + password);
  if (existuser !== undefined) {
    res.send(JSON.stringify({ success: false, reason: "Username exists" }));
    return;
  }

  if (password == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return;
  }
  if (username == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return;
  }
  accounts.set(username, password);
  res.send(JSON.stringify({ success: true }));
});

//login
app.post("/login", (req, res) => {
  let parsed = JSON.parse(req.body);
  let username = parsed.username;
  let password = parsed.password;
  let existuser = accounts.get(username);
  console.log("login: " + username + " password: " + password);
  if (username == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return;
  }

  if (password == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return;
  }

  if (accounts.has(username) == false) {
    res.send(JSON.stringify({ success: false, reason: "User does not exist" }));
    return;
  }

  if (password !== existuser) {
    res.send(JSON.stringify({ success: false, reason: "Invalid password" }));
    return;
  }

  if (password == existuser) {
    let sessId = sessionid();
    sessions.set(sessId, username);
    res.send(JSON.stringify({ success: true, token: sessId }));
    return;
  }
});

//create channel
app.post("/create-channel", (req, res) => {
  //check for empty body before using Parse which causes errors
  if (Object.keys(req.body).length == 0) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let channel = parsed.channelName;
  let existusername = sessions.get(token);
  console.log("Create channel: " + channel + " token: " + token);
  if (token == undefined) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }

  if (sessions.has(token) == false) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (channel == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }

  if (channels.has(channel) == true) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel already exists" })
    );
    return;
  }
  //store creator of channel
  channels.set(channel, token);
  res.send(JSON.stringify({ success: true }));
});

//join channel
app.post("/join-channel", (req, res) => {
  //check for empty body before using Parse which causes errors
  if (Object.keys(req.body).length == 0) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let existusername = sessions.get(token);
  let channel = parsed.channelName;
  let banuser = ban.get(channel);
  console.log("Join channel: " + channel + " token: " + token);

  if (accounts.has(banuser) == true) {
    res.send(JSON.stringify({ success: false, reason: "User is banned" }));
    return;
  }

  if (token == undefined) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }

  if (sessions.has(token) == false) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (channel == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }

  if (channels.has(channel) == false) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }

  for (var i in arrchannel) {
    if (arrchannel[i][0] == channel && arrchannel[i][1] == token) {
      res.send(
        JSON.stringify({ success: false, reason: "User has already joined" })
      );
      return;
    }
  }

//populate channel array
  arrchannel.push([channel, token, existusername, ""]);
  res.send(JSON.stringify({ success: true }));
});

//leave channel
app.post("/leave-channel", (req, res) => {
  //check for empty body before using Parse which causes errors
  if (Object.keys(req.body).length == 0) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let channel = parsed.channelName;
  console.log("Leave channel: " + channel + " token: " + token);
  if (token == undefined) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }

  if (sessions.has(token) == false) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (channel == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }

  if (channels.has(channel) == false) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }
  for (var i in arrchannel) {
    if (arrchannel[i][0] == channel && arrchannel[i][1] == token) {
      res.send(JSON.stringify({ success: true }));
      //arrchannel[i].splice([0, 4]);
      arrchannel[i][0] = " ";
      arrchannel[i][1] = " ";
      arrchannel[i][2] = " ";
      arrchannel[i][4] = " ";
      return;
    }
  }

  res.send(
    JSON.stringify({
      success: false,
      reason: "User is not part of this channel"
    })
  );
  return;
});

//joined
app.get("/joined", (req, res) => {
  let token = req.headers.token;
  let existusername = sessions.get(token);
  let channel = req.query.channelName;
  console.log("Get Joined: " + channel + " token: " + token);
  if (token == undefined) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }

  if (sessions.has(token) == false) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (channels.has(channel) == false) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }

  var userlist = [];
  for (var i in arrchannel) {
    if (arrchannel[i][0] == channel) {
      userlist.push(arrchannel[i][2]);
    }
  }

  for (var i in arrchannel) {
     if (arrchannel[i][0] == channel && arrchannel[i][1] == token) {
      res.send(JSON.stringify({ success: true, joined: userlist }));
      return;
    }
  }

  res.send(
    JSON.stringify({
      success: false,
      reason: "User is not part of this channel"
    })
  );
  return;
});

//delete channel
app.post("/delete", (req, res) => {
  //check for empty body before using Parse which causes errors
  if (Object.keys(req.body).length == 0) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let channel = parsed.channelName;
  let existtoken = channels.get(channel);
  let existusername = sessions.get(token);
  console.log("Delete channel: " + channel + " token: " + token);

  if (token == undefined) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }

  if (sessions.has(token) == false) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (channel == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }

  if (channels.has(channel) == false) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }

  if (existtoken == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "not creator of channel" })
    );
    return;
  }

  //delete channel
  channels.delete(channel);

  var check;
  for (var i in arrchannel) {
    for (var j in arrchannel[i]) {
      if (arrchannel[i][0] == channel) {
        //arrchannel[i].splice([0, 4]);
        arrchannel[i][0] = " ";
        arrchannel[i][1] = " ";
        arrchannel[i][2] = " ";
        arrchannel[i][4] = " ";
      }
    }
  }
  if (check == 0) {
    JSON.stringify({
      success: false,
      reason: "User is not part of this channel"
    });
  }

  res.send(JSON.stringify({ success: true }));
});

//kick
app.post("/kick", (req, res) => {
  //check for empty body before using Parse which causes errors
  if (Object.keys(req.body).length == 0) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let channel = parsed.channelName;
  let target = parsed.target;
  let existtoken = channels.get(channel);
  let existusername = sessions.get(token);
  console.log("Kick : " + channel + " token: " + token);

  if (token == undefined) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }

  if (sessions.has(token) == false) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (channel == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }

  if (channels.has(channel) == false) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }

  if (target == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "target field missing" })
    );
    return;
  }

  if (token !== existtoken) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel not owned by user" })
    );
    return;
  }

  var check;
  for (var i in arrchannel) {
    //console.log("**row " + i);
    for (var j in arrchannel[i]) {
        if (arrchannel[i][0] == channel && arrchannel[i][2] == target) {
        //arrchannel[i].splice([0, 4]);
        arrchannel[i][0] = " ";
        arrchannel[i][1] = " ";
        arrchannel[i][2] = " ";
        arrchannel[i][4] = " ";
      }
    }
  }
  if (check == 0) {
    JSON.stringify({
      success: false,
      reason: "User is not part of this channel"
    });
  }

  res.send(JSON.stringify({ success: true }));
});

//ban
app.post("/ban", (req, res) => {
  //check for empty body before using Parse which causes errors
  if (Object.keys(req.body).length == 0) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let channel = parsed.channelName;
  let target = parsed.target;
  let existtoken = channels.get(channel);
  let existusername = sessions.get(token);
  console.log("ban: " + channel + " token: " + target);

  if (token == undefined) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }

  if (sessions.has(token) == false) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (channel == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }

  if (channels.has(channel) == false) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }

  if (target == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "target field missing" })
    );
    return;
  }

  if (token !== existtoken) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel not owned by user" })
    );
    return;
  }
//populate ban map
  ban.set(channel, target);
  res.send(JSON.stringify({ success: true }));
});

//message
app.post("/message", (req, res) => {
  //check for empty body before using Parse which causes errors
  if (Object.keys(req.body).length == 0) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }
  let parsed = JSON.parse(req.body);
  let message = parsed.contents;
  let token = req.headers.token;
  let existusername = sessions.get(token);
  let channel = parsed.channelName;
  console.log("Post Message - " + channel + " Message: " + message);

  if (token == undefined) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }

  if (sessions.has(token) == false) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (channel == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }

  if (message == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "contents field missing" })
    );
    return;
  }

  for (var i in arrchannel) {
    //check if channel and user exist and put message in channel array
    if (arrchannel[i][0] == channel && arrchannel[i][1] == token) {
      arrchannel[i][3] = message;

      res.send(JSON.stringify({ success: true }));
      return;
    }
  }
  res.send(
    JSON.stringify({
      success: false,
      reason: "User is not part of this channel"
    })
  );
  return;
});

//get messages
app.get("/messages", (req, res) => {
  let token = req.headers.token;
  let existusername = sessions.get(token);
  let channel = req.query.channelName;
  console.log("Get Message Channel: " + channel + " token: " + token);

  if (channel == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "channelName field missing" })
    );
    return;
  }

  if (sessions.has(token) == false) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (channels.has(channel) == false) {
    res.send(
      JSON.stringify({ success: false, reason: "Channel does not exist" })
    );
    return;
  }

  var listmessage = [];
  var usercheck = 0;
  var channelcheck = 0;
  for (var i in arrchannel) {
    if (arrchannel[i][0] == channel) {
      channelcheck = 1;
      if (arrchannel[i][3] != "") {
        var message = { from: arrchannel[i][2], contents: arrchannel[i][3] };
        listmessage.push(message);
      }
    }
    if (arrchannel[i][1] == token) {
      usercheck = 1;
    }
  }

  if (channelcheck == 1 && usercheck == 1) {
    res.send(JSON.stringify({ success: true, messages: listmessage }));
    return;
  }

  if (channelcheck == 0 && usercheck == 1) {
    res.send(JSON.stringify({ success: true, messages: "[]" }));
    return;
  }

  if (usercheck == 0) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "User is not part of this channel"
      })
    );
    return;
  }

  res.send(
    JSON.stringify({
      success: false,
      reason: "User is not part of this channel"
    })
  );
  return;
});

app.listen(process.env.PORT || 3000)

// const listener = app.listen(process.env.PORT, () => {
//   console.log("Your app is listening on port " + listener.address().port);
// });
