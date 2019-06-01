const express = require("express");
const fs = require("fs");
const aws = require('aws-sdk');
const app = express();
const http = require("http");
const server = http.createServer(app);
const passport = require("passport");
const Strategy = require("passport-local").Strategy;
const path = require("path");

const io = require("socket.io")(server);
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

mongoose.set("useFindAndModify", false);
const cookieSession = require("cookie-session");

const keys = require("./config/keys");

const User = require("./database/user");
const Chat = require("./database/chat");

const ObjectId = mongoose.Types.ObjectId;

const S3_BUCKET = process.env.S3_Bucket_Name;

aws.config.region = 'us-east-2';




/*  Authorization for logging into mobi chat room  */
passport.use(
  new Strategy((username, password, cb) => {
    User.findOne({ username: username }, null, null, (err, user) => {
      // Error
      if (err) {
        return cb(err);
      }
      // Could not find a mobi chat room with matching code
      if (user === null) {
        return cb(null, false, { message: "Invalid username" });
      }
      // User did not provide a username
      if (user.password !== password) {
        return cb(null, false, { message: "Incorrect password" });
      }
      // Login successful
      return cb(null, user);
    });
  })
);

if (process.env.PORT !== 5000) {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, "client/build")));
}

// Serve static files from the React app
//app.use(express.static(path.join(__dirname, 'client/build')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  cookieSession({
    keys: [keys.session.cookieKey]
  })
);
app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 5000;

/*  Connect to mongodb database using mongoose  */
mongoose.connect(keys.mongodb.uri, { useNewUrlParser: true });
let db = mongoose.connection;
db.on("error", err => {
  console.log(err);
});

/*  Store mobi chat room data */
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then(user => {
    done(null, user);
  });
});

const deleteChat = chatId => {
  Chat.findByIdAndRemove(chatId, (err, chat) => {
    User.find({ _id: { $in: chat.members } }, (err, users) => {
      users.map(user => {
        user.chats.pull(chat._id);
        user.save();
      });
    });
  });
};

let usersOnline = {};
let files = {};
let struct = {
  name: null,
  type: null,
  size: 0,
  data: [],
  slice: 0
};

// Client has connected
io.on("connection", socket => {
  socket.emit("connected");

  app.get('/account', (req, res) => res.render('account.html'));

  app.get('/sign-s3', (req, res) => {
    console.log(S3_BUCKET);
    const s3 = new aws.S3();
    const fileName = req.query['file-name'];
    const fileType = req.query['file-type'];
    const s3Params = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Expires: 60,
      ContentType: fileType,
      ACL: 'public-read'
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
      if(err){
        console.log(err);
        return res.end();
      }
      const returnData = {
        signedRequest: data,
        url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
      };
      console.log(returnData);
      res.write(JSON.stringify(returnData));
      res.end();
    });
  });

/*
  socket.on('slice-upload', (data) => {
    console.log('uploading: ', data);
    if (!files[data.name]) {
      files[data.name] = Object.assign({}, struct, data);
      files[data.name].data = [];
    }

    // convert the ArrayBuffer to Buffer
    //data.data = new Buffer(new Uint8Array(data.data));
    //save data
    files[data.name].data.push(data.data);
    files[data.name].slice++;
    if (files[data.name].slice * 100000 >= files[data.name].size) {
      let fileBuffer = Buffer.concat(files[data.name].data);

      fs.writeFile('/tmp/' + data.name, fileBuffer, (err) => {
        delete files[data.name];
        if (err)
          return socket.emit('upload-error');
        socket.emit('end-upload');
      });
    }
    else {
      socket.emit('request-slice-upload', {
        currentSlice: files[data.name].slice
      });
    }
  });
  */


  /* user changed username. as a result send a new username list
     to each member of each of the user's chats
  */
  socket.on("username-changed", userId => {
    // find the user who just changed his username
    User.findById(userId, (err, user) => {
      // get all of the chats that the user is a part of
      Chat.find( { _id: { $in: user.chats } }, (err, chats) => {
        // loop through all his chats
        for (let i = 0; i < chats.length; i++) {
          // for each of his chats get all of the members
          User.find( { _id: { $in: chats[i].members } }, (err, users) => {
            let members = {};
            // loop through all of the members and store
            // them as an object
            // key(_id): value(username)
            for (let j = 0; j < users.length; j++) {
              members[users[j]._id] = users[j].username;
            }
            socket.broadcast.to(chats[i]._id).emit("return-members", members);
          });
        }
      });
    });
  });

  /* someone has entered the chat */
  socket.on("user-entered-chat", data => {
    socket.join(data.chatId);
    socket.username = data.username;
    socket.chatId = data.chatId;
    socket.broadcast.to(data.chatId).emit("user-entered-chat", data);
    if (!usersOnline[data.chatId]) usersOnline[data.chatId] = [];
    usersOnline[data.chatId].push(data.username);
    socket.emit("users-online", usersOnline);
  });

  // once user has entered chat set the chat id
  // as the socket id since we will have to broadcast
  // and we don't want to send messages to people in other
  // chats

  /* Send what the members are typing to everyone else in the chat */
  socket.on("preview-message", data => {
    socket.broadcast.to(data.chatId).emit("preview-message", data);
  });

  socket.on("disconnect", () => {
    if (usersOnline[socket.chatId] !== undefined)
      usersOnline[socket.chatId].splice(
        usersOnline[socket.chatId].indexOf(socket.username),
      );
    socket.broadcast.to(socket.chatId).emit("user-left-chat", {
      username: socket.username,
      chatId: socket.chatId
    });
  });

  socket.on("left-chat", () => {
    if (usersOnline[socket.chatId] !== undefined)
      usersOnline[socket.chatId].splice(
        usersOnline[socket.chatId].indexOf(socket.username),
      );
    socket.broadcast.to(socket.chatId).emit("user-left-chat", {
      username: socket.username,
      chatId: socket.chatId
    });
  });

  /* Send what the members are typing to everyone else in the chat */
  //socket.on("show-message-preview-box", data => {
  //socket.broadcast.to(data.chatId).emit("show-message-preview-box", data);
  //});

  ////////////////////////////////////////////////////////////////

  /*  Create Account */
  app.post("/create-account", (req, res) => {
    const account = req.body;
    // Checks to see if the username is unique
    User.findOne({ username: account.username }, null, null, (err, user) => {
      // Unique username
      if (err || !user) {
        const user = new User({
          username: account.username,
          email: account.email,
          password: account.password,
          chats: []
        });
        user.save();
        res.send({ duplicate: false, success: true }).status(200);
      } else {
        res.send({ duplicate: true, success: false }).status(200);
      }
    });
  });

  /* Logs the user in */
  app.post("/login", passport.authenticate("local"), (req, res) => {
    socket.username = req.user.username;
    socket.userId = req.user._id;
    res.send({
      success: true,
      message: "authentication succeeded",
      user: req.user
    });
  });

  /* Gets all of the currently loggin user's chats */
  app.get("/get-chats", (req, res) => {
    Chat.find({ members: req.user._id }, (err, chats) => {
      if (err) res.send({ success: false });
      else {
        let ownerId = [];
        chats.forEach(chat => ownerId.push(chat.owner));
        res.send({ success: true, chats });
      }
    });
  });

  /* Creates new chat room for user */
  /*  Creates A Chat Room  and returns the name of the new chat room and the unique id */
  app.post("/create-chat", (req, res) => {
    const chatName = req.body.chatName;
    // Create new chat
    const chat = new Chat({
      chatName: chatName,
      owner: req.user._id,
      members: [req.user._id],
      messages: []
    });
    // Save the newly created chat
    chat.save((err, newChat) => {
      if (!err) {
        // add a reference to the chat to the user
        req.user.chats.push(newChat._id);
        req.user.save();
        let members = {};
        members[req.user._id] = req.body.username;
        return res.send({ success: true, chat, members });
      } else {
        return res.send({ success: false });
      }
    });
  });

  /* Returns all of the selected users chats */
  socket.on("get chats", data => {
    User.findOne({ username: data.username }, (err, user) => {
      if (user) {
        Chat.find({ _id: { $in: user.chats } }, (err, chats) => {
          if (chats.length) socket.emit("got other chats", chats);
        });
      }
    });
  });

  /*  Delete a chat and update each of the users */
  app.post("/delete-chat", (req, res) => {
    deleteChat(req.body.chatId);
    res.send({ success: true });
  });

  /*
    leave a chat. if you are the owner of the chat
    you must first change the owner or
    you can force a leave which will make
    a random person the owner
  */
  app.post("/leave-chat", (req, res) => {
    // get the index of user inside the members array

    // find the chat that the user is leaving
    Chat.findOne({ _id: req.body.chatId }, (err, chat) => {
      const index = chat.members.indexOf(req.user._id);
      // you are the owner of the chat
      if (req.user._id.toString() === chat.owner.toString()) {
        // find the other members and send user info to the front end
        User.find({ _id: { $in: chat.members } }, (err, users) => {
          let x = [];
          if (users.length) {
            users.forEach(user => {
              x.push(user.username);
            });
            res.send({ success: false, message: "owner cannot leave chat. first change owner", members: x });
          }
        });
      }
      // you are the only member left in the chat
      else if (chat.members.length === 1) {
        deleteChat(chat._id);
        chat.members.splice(index, 1);
        chat.save();
        res.send({ success: true });
      }

      // you are not the owner of the chat
      else if (req.user._id !== chat.owner._id) {
        chat.members.splice(index, 1);
        chat.save();
        const chatIndex = req.user.chats.indexOf(chat._id);
        req.user.chats.splice(chatIndex, 1);
        req.user.save();
        // let everyone in the chat know that the member left
        res.send({ success: true });
      }
    });
  });

  // change chat name
  app.post("/change-chat-name", (req, res) => {
    Chat.findById(req.body.chatId, (err, chat) => {
      chat.chatName = req.body.newChatName;
      chat.save(err => {
        if (err) res.send({ success: false });
        else res.send({ success: true });
      });
    });
  });

  /* Change chat owner */
  app.post("/change-chat-owner", (req, res) => {
    // find the chat that you are altering
    Chat.findById(req.body.chatId, (err, chat) => {
      // find the owner who is becoming the new owner
      User.find(
        // find the user by username
        { username: req.body.username },
        (err, user) => {
          // change the owner
          chat.owner = user[0]._id;
          chat.save();
          res.send({ success: true });
        }
      );
    });
  });

  /* Return all of the members of the chat */
  app.post("/get-chat-members", (req, res) => {
    // find the chat that we are looking for
    Chat.findById(req.body.chatId, (err, chat) => {
      // find all of the members of the chat
      User.find({ _id: { $in: chat.members } }, (err, members) => {
        // send all of the members
        res.send({ members });
      });
    });
  });

  /* Change chat username */
  app.post("/change-username", (req, res) => {
    User.findOne({ username: req.body.username }, (err, user) => {
      // Unique username
      // if not unique send back error
      if (err || !user) {
        req.user.username = req.body.username;
        req.user.save();
        res.send({ success: true });
      } else {
        res.send({ success: false, message: "username already in use" });
      }
    });
  });

  /* store a new message in the database */
  socket.on("new-message", data => {
    User.findById(data.userId, (err, user) => {
      Chat.findById(data.chatId, (err, chat) => {
        const message = {
          userId: data.userId,
          message: data.message
        };
        chat.messages.push(message);
        chat.save();
        socket.emit("message-sent", message);
        socket.broadcast.to(data.chatId).emit("message-sent", message);
      });
    });
  });

  /*  Check to see if user cookies are stored in browser */
  app.get("/user", (req, res, next) => {
    // user cookie stored in browser
    if (req.user) {
      const user = {
        success: true,
        email: req.user.email,
        username: req.user.username,
        password: req.user.password
      };
      res.send({ success: true, user });
    }
    // user cookie not stored in browser
    else {
      res.send({ success: false, email: "", username: "", password: "" });
    }
  });

  /* Allow a user to join someone else's chat */
  app.post("/join", (req, res) => {
    let flag = false;
    // Check to see if user has already joined requested chat
    req.user.chats.forEach(chatId => {
      if (chatId.toString() === req.body.chatId.toString()) flag = true;
    });
    // if the user has not yet joined the chat make him/her join it
    if (!flag) {
      Chat.findOne({ _id: req.body.chatId }, null, null, (err, chat) => {
        if (err) return res.send({ success: false });
        else if (chat === null) return res.send({ success: false });
        else {
          chat.members.push(req.user._id);
          chat.save((err, savedChat) => {
            const newChat = chat._id;
            req.user.chats.push(chat._id);
            req.user.save((err, user) => {
              if (err) return res.send({ success: false });
              else {
                return res.send({ success: true, savedChat });
              }
            });
          });
        }
      });
    } else
      return res.send({
        success: false,
        message: "you have already joined this chat"
      });
  });

  /* Get single chat room data  */
  app.post("/enterChat", (req, res) => {
    // Find the chat with the corresponding chatId
    Chat.findOne({ _id: req.body.chatId }, (err, chat) => {
      // if there was an error or the chat does not exist
      if (err || chat === null) res.send({ success: false });
      // chat was found
      else {
        User.find({ _id: { $in: chat.members } }, (err, users) => {
          let members = {};
          users.forEach(user => {
            members[user._id] = user.username;
          });
          res.send({ success: true, chat, members });
        });
      }
    });
  });

  /* Send a message */
  app.post("/message", (req, res) => {
    const message = req.body;
    const user = req.user;
    let chatRoom = user.chatRooms.id(message.chatId);
    let index = 0;

    // Saves message and user info */
    if (chatRoom) {
      index = chatRoom.messages.push({
        userId: req.user._id,
        message: message.message,
        timeStamp: new Date()
      });
      // update user with new message
      user.save();
      // emit new message to everyone else
      socket.broadcast.emit("new message", chatRoom.messages[index - 1]);
      res.send({ success: true });
    } else {
      res.send({ success: false });
    }
  });

  /* EXTRA SHIT */

  // { chatId: '' }
  socket.on("delete-chat", data => {
    Chat.findByIdAndRemove(data.chatId, (err, chat) => {
      const chats = chat.members[0];
      User.updateMany(
        { _id: { $in: chat.members } },
        { $pull: { chats: chat._id } }
      );
    }); // executes
  });

  // user leave chat
  // the user is removed from the chat's members prop
  // and the chat id is removed from the member's chats prop
  socket.on("leave-chat", data => {
    // If there is only one member in the chat
    // delete its
    // otherwise just remove the member
    Chat.updateOne(
      { _id: data.chatId },
      { $pull: { members: { $elemMatch: { username: data.username } } } },
      { safe: true, multi: true },
      function(err, obj) {
        //do something smart
        if (err) console.log("ERROR: ", err);
      }
    )
      .then(() => {
        User.updateOne(
          { _id: data.userId },
          { $pull: { chats: data.chatId } },
          { safe: true, multi: true },
          function(err, obj) {
            //do something smart
            if (err) console.log(err);
          }
        );
      })
      .then(() => {
        Chat.findOne({ _id: data.chatId }, (err1, doc1) => {
          // doc here is actually err
          // handle err1
          if (err1) console.log(err);
          if (doc1.members.length <= 1)
            doc1.remove((err, doc2) => {
              if (err) console.log(err);
            });
        });
      })
      .then(() => {
        socket.emit("chat-left", data);
        socket.broadcast.emit("chat-left", data);
      });
  });
});

server.listen(port);
