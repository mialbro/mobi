const express = require("express");
const router = express.Router();
const app = express();
const server = require("http").Server(app);
var passport = require("passport");
var Strategy = require("passport-local").Strategy;
const path = require('path');

const io = require("socket.io")(server);
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");

const keys = require('./config/keys');

const User = require("./database/user");
const Chat = require("./database/chat");


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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  cookieSession({
    keys: [keys.session.cookieKey]
  })
);
app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 3000;

//Static file declaration
app.use(express.static(path.join(__dirname, 'client/build')));

//production mode
if(process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  //
  app.get('*', (req, res) => {
    res.sendfile(path.join(__dirname = 'client/build/index.html'));
  })
}

app.get('*', (req, res) => {
  res.sendfile(path.join(__dirname = 'client/build/index.html'));
})

/*  Connect to mongodb database using mongoose  */
mongoose.connect(keys.mongodb.uri, { useNewUrlParser: true });
let db = mongoose.connection;
db.on("error", err => {
  throw err;
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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express App running' });
});


// Client has connected
io.on("connection", socket => {
  socket.emit("connected");

  // once user has entered chat set the chat id
  // as the socket id since we will have to broadcast
  // and we don't want to send messages to people in other
  // chats
  socket.on("chat online", chatId => {
    socket.join(chatId);
  });

  socket.on("create mobi", room => {
    const mobi = newMobi(room);
    socket.emit("new mobi", mobi);
  });

  socket.on("get chats", data => {
    Chat.find(
      { ownerUsername: data.ownerUsername },
      null,
      null,
      (err, chats) => {
        if (err) socket.emit("error");
        else {
          socket.emit("got other chats", chats);
        }
      }
    );
  });

  /* store a new message in the database */
  socket.on("new message", data => {
    let index = 0;
    Chat.findOne({ _id: data.chatId }, (err, chat) => {
      if (err || chat === null) socket.emit("error sending message");
      else {
        index = chat.messages.push(data.message);
        chat.save((err, chat) => {
          if (err) return socket.emit("error sending message");
          else {
            socket.emit("message sent", chat.messages[index - 1]);
            socket.broadcast
              .to(data.chatId)
              .emit("message sent", chat.messages[index - 1]);
          }
        });
      }
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

  /*  Create Account */
  app.post("/createAccount", (req, res) => {
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
    res.send({
      success: true,
      message: "authentication succeeded",
      user: req.user
    });
  });

  /* Gets all of the chat rooms */
  app.get("/getChats", (req, res) => {
    Chat.find(
      { members: { $elemMatch: { username: req.user.username } } },
      (err, chats) => {
        if (err) res.send({ success: false });
        else {
          res.send({ success: true, chats });
        }
      }
    );
  });

  /* Creates new chat room for user */
  /*  Creates A Chat Room  and returns the name of the new chat room and the unique id */
  app.post("/createChat", (req, res) => {
    const chatName = req.body.chatName;
    if (chatName.length < 4)
      return res.send({
        success: false,
        error: "chat name must be at least 4 characters"
      });
    // Create new chat
    const chat = new Chat({
      chatName: chatName,
      ownerUsername: req.user.username,
      ownerEmail: req.user.email,
      members: [{ email: req.user.email, username: req.user.username }],
      messages: []
    });
    // Save the newly created chat
    chat.save((err, newChat) => {
      if (!err) {
        // add a reference to the chat to the user
        req.user.chats.push({
          chatName: chatName,
          chatId: newChat._id
        });
        req.user.save();
        return res.send({ success: true, chat });
      } else {
        return res.send({ success: false });
      }
    });
  });

  /* Allow a user to join someone else's chat */
  app.post("/join", (req, res) => {
    let flag = false;
    // Check to see if user has already joined requested chat
    req.user.chats.forEach(props => {
      if (props.chatId.toString() === req.body.chatId.toString()) flag = true;
    });
    // if the user has not yet joined the chat make him/her join it
    if (!flag) {
      Chat.findOne({ _id: req.body.chatId }, null, null, (err, chat) => {
        if (err) return res.send({ success: false });
        else if (chat === null) return res.send({ success: false });
        else {
          chat.members.push({
            email: req.user.email,
            username: req.user.username
          });
          chat.save();
          const newChat = { chatName: chat.chatName, chatId: chat._id };
          req.user.chats.push(newChat);
          req.user.save(err => {
            if (err) return res.send({ success: false });
            else {
              return res.send({ success: true, newChat });
            }
          });
        }
      });
    } else
      return res.send({
        success: false,
        error: "you have already joined this chat"
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
        res.send({ success: true, chat });
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
        userId: user._id,
        email: user.email,
        username: user.username,
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
});

server.listen(port);
