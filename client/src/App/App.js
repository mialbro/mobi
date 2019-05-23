import React, { Component } from "react";
import io from "socket.io-client";
import Chat from "../Chat";
import Main from "../Main";
import Welcome from "../Welcome";
import Container from "react-bootstrap/Container";
import Jumbotron  from "react-bootstrap/Jumbotron";

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
      chat: {}
    };
  }

  componentDidMount() {
    this.socket = io();
    this.socket.on("login successful", user => {});

    this.socket.on("account created", account => {});

    this.socket.on("duplicate username", account => {});
  }

  handleStart = value => {
    this.setState((state, props) => ({
      status: value
    }));
  };

  handleBuild = mobi => {
    this.setState((state, props) => ({
      status: "share",
      email: mobi.email,
      username: mobi.username,
      code: mobi.code,
      mobiName: mobi.mobiName,
      id: mobi.id
    }));
  };

  handleEnterRoom = e => {
    e.persist();
    this.setState((state, props) => ({
      status: "chat"
    }));
  };

  handleLogin = data => {
    const { user } = data;
    this.setState({
      email: user.email,
      username: user.username,
      id: user._id,
      chatRooms: user.chatRooms,
      status: "main"
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

  handleEnterChat = chat => {
    this.setState({ status: "chat", chat: chat });
  };

  goHome = () => {
    this.setState({ status: 'main' });
  }

  render() {
    const { status, email, username, id } = this.state;
    let body;
    if (status === "welcome")
      body = (
        <Welcome
          postData={this.postData}
          url={"http://localhost:8080"}
          handleLogin={this.handleLogin}
        />
      );
    else if (status === "main")
      body = (
        <Main
          user={this.state}
          handleEnterChat={this.handleEnterChat}
          socket={this.socket}
        />
      );
    else if (status === "chat")
      body = (
        <Chat
          chat={this.state.chat}
          user={{ email: email, username: username, id: id }}
          socket={this.socket}
          goHome={this.goHome}
        />
      );

    return (
      <Container>
        <Jumbotron fluid style={{ marginTop: '1em'}}>
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
