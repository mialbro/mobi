import React, { Component } from "react";
import io from "socket.io-client";
import Chat from "../Chat";
import Main from "../Main";
import Welcome from "../Welcome";
import Container from "react-bootstrap/Container";
import Jumbotron from "react-bootstrap/Jumbotron";

class App extends Component {
  constructor(props) {
    super(props);
    this.socket = null;
    this.state = {
      status: "welcome",
      email: String,
      username: String,
      password: String,
      code: String,
      mobiName: String,
      id: String,
      chat: {},
      chats: [],
      members: {},
      userOnline: []
    };
  }

  componentDidMount() {
    this.socket = io();

    this.socket.on("return-members", data => {
      this.setState({ members: data });
    });

    // Update chat list if a chat was deleted
    // And the user has not refreshed their screen
    this.socket.on("chat-deleted", data => {
      const { chats } = this.state;
      const index = chats.findIndex(obj => obj.chatId === data.chatId);
      chats.splice(index, 1);
      this.setState({ chats: chats });
    });

    this.socket.on("chat-left", data => {
      const { chats } = this.state;
      const index = chats.findIndex(obj => obj.chatId === data.chatId);
      chats.splice(index, 1);
      this.setState({ chats: chats });
    });
  }

  /* store user data in state */
  handleLogin = data => {
    const { user } = data;
    this.setState({
      email: user.email,
      username: user.username,
      id: user._id,
      status: "main"
    });
  };

  getChats = () => {
    fetch("/get-chats", {
      header: { "Content-Type": "application/json" },
      method: "GET"
    })
      .then(res => res.json())
      .then(res => {
        let chats = [];
        if (res.success) {
          res.chats.forEach(chat => {
            chats.push({
              chatName: chat.chatName,
              chatId: chat._id,
              owner: chat.owner
            });
          });
          this.setState({ chats: chats });
        }
      })
      .catch(err => console.log(err));
  };

  /* Creates a new chat and adds it to the user */
  createNewChat = data => {
    fetch("/create-chat", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(res => {
        const { chat } = res;
        if (res.success) {
          this.setState((prevState, props) => {
            return {
              // if successful add chat and clear state appropiate state properties
              chats: prevState.chats.concat([
                {
                  chatName: chat.chatName,
                  chatId: chat._id,
                  owner: chat.owner
                }
              ]),
              members: res.members
            };
          });
          this.getChats();
        } else {
          console.log(res.error);
        }
      })
      .catch(err => console.log(err));
  };

  /* Join a chat that already exists */
  joinChat = data => {
    // get the chat name and chat id from the button */
    fetch("/join", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(res => {
        // if successfully joined, add new chat to chats in States
        // and clear the join, chatsToJoin, and newChatOwner properties

        if (res.success) {
          this.getChats();
          //this.setState({ chats: this.state.chats.concat(chat) });
        } else alert(res.message);
      });
  };

  // Post data to server
  postData = (url, data) => {
    fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .catch(error => console.error("Error:", error));
  };

  handleEnterChat = (chat, members) => {
    this.setState({ status: "chat", chat: chat, members: members });
  };

  goHome = () => {
    this.setState({ status: "main" });
  };

  handleLeaveChat = e => {
    //e.persist();
    const data = {
      chatId: e.target.name,
      userId: this.state.id,
      username: this.state.username
    };
    this.x("leave-chat", data);
  };

  handleChatDelete = e => {
    const data = { chatId: e.target.name, userId: this.state.id };
    this.x("/delete-chat", data);
    //this.socket.emit('delete-chat', data);
  };

  x = (url, data) => {
    // get the chat name and chat id from the button */
    fetch(url, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          const { chats } = this.state;
          const index = chats.findIndex(obj => obj.chatId === data.chatId);
          chats.splice(index, 1);
          this.setState({ chats: chats });
        } else {
          alert(res.message);
        }
      });
  };

  handleUsernameChange = username => {
    this.setState({ username: username });
    this.socket.emit("username-changed", this.state.id);
  };

  handleNewMessage = message => {
    let { chat } = this.state;
    chat.messages.push(message);
    this.setState({ chat: chat });
  };

  handleUserOnline = user => {
    let { userOnline } = this.state;
    userOnline.push(user);
    this.setState({ userOnline: userOnline });
  };

  render() {
    const { status, email, username, id } = this.state;
    let body;
    if (status === "welcome")
      body = (
        <Welcome
          userOnline={this.userOnline}
          postData={this.postData}
          url={"http://localhost:8080"}
          handleLogin={this.handleLogin}
        />
      );
    else if (status === "main")
      body = (
        <Main
          handleUsernameChange={this.handleUsernameChange}
          user={{ email: email, username: username, id: id }}
          handleEnterChat={this.handleEnterChat}
          socket={this.socket}
          getChats={this.getChats}
          chats={this.state.chats}
          handleLeaveChat={this.handleLeaveChat}
          handleChatDelete={this.handleChatDelete}
          createNewChat={this.createNewChat}
          joinChat={this.joinChat}
        />
      );
    else if (status === "chat")
      body = (
        <Chat
          handleUserOnline={this.handleUserOnline}
          userOnline={this.state.userOnline}
          handleNewMessage={this.handleNewMessage}
          chat={this.state.chat}
          members={this.state.members}
          user={{ email: email, username: username, id: id }}
          socket={this.socket}
          goHome={this.goHome}
        />
      );

    return (
      <Container>
        <Jumbotron fluid style={{ marginTop: "1em" }}>
          <Container>
            <h1 className="text-center">Mobi</h1>
          </Container>
        </Jumbotron>
        {body}
      </Container>
    );
  }
}

export default App;
