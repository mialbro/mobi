import React, { Component } from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import ButtonToolbar from "react-bootstrap/Row";

class Main extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.newChatOwner = "";
    this.state = {
      username: "",
      newChatName: "",
      newChat: false,
      chats: [],
      join: false,
      newChatOwner: "",
      chatsToJoin: []
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this.getChats();
    // listens for when someone enters the username of a user who owns
    // a chat that they want to join and returns each of their chats
    // and stores it in state
    this.props.socket.on("got other chats", chats => {
      this.setState({ chatsToJoin: chats });
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  /* sets data as the name of the new chat and creates the new chat */
  handleCreateNewChatSubmit = () => {
    let data = { chatName: this.state.newChatName };
    this.createNewChat(data);
  };

  /* Gets the other user's chats */
  getOtherChats = () => {
    this.newChatOwner = this.state.newChatOwner;
    let data = { ownerUsername: this.state.newChatOwner };
    this.props.socket.emit("get chats", data);
  };

  /* Join a chat that already exists */
  joinChat = e => {
    e.persist();
    // get the chat name and chat id from the button */
    let holder = e.target.name.split("_");
    const data = { chatName: holder[0], chatId: holder[1] };
    fetch("/join", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(res => {
        const chat = res.newChat;
        // if successfully joined, add new chat to chats in States
        // and clear the join, chatsToJoin, and newChatOwner properties
        if (res.success && this._isMounted) {
          this.setState((prevState, props) => {
            return {
              chats: prevState.chats.concat([
                {
                  chatName: chat.chatName,
                  chatId: chat.chatId,
                  ownerUsername: this.state.newChatOwner
                }
              ]),
              join: false,
              newChatOwner: "",
              chatsToJoin: []
            };
          });
        } else console.log(res.error);
      });
  };

  /* Creates a new chat and adds it to the user */
  createNewChat = data => {
    fetch("/createChat", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(res => {
        const { chat } = res;
        if (res.success && this._isMounted) {
          this.setState((prevState, props) => {
            return {
              // if successful add chat and clear state appropiate state properties
              chats: prevState.chats.concat([
                {
                  chatName: chat.chatName,
                  chatId: chat._id,
                  ownerUsername: chat.ownerUsername
                }
              ]),
              newChat: false,
              newChatName: ""
            };
          });
        } else {
          console.log(res.error);
        }
      })
      .catch(err => console.log(err));
  };

  /*  update the state property for the name of the chat to create  */
  updateNewChatName = e => {
    e.persist();
    this.setState({ newChatName: e.target.value });
  };

  /* update state property for the owner of the chat to join */
  updateNewChatOwner = e => {
    e.persist();
    this.setState({ newChatOwner: e.target.value });
  };

  getChats = () => {
    fetch("/getChats", {
      header: { "Content-Type": "application/json" },
      method: "GET"
    })
      .then(res => res.json())
      .then(res => {
        let chats = [];
        if (res.success && this._isMounted) {
          res.chats.forEach(chat => {
            chats.push({
              chatName: chat.chatName,
              chatId: chat._id,
              ownerUsername: chat.ownerUsername
            });
          });
          this.setState((prevState, props) => {
            return {
              chats: prevState.chats.concat(chats),
              newChat: false,
              newChatName: ""
            };
          });
        }
      })
      .catch(err => console.log(err));
  };

  simulateClick = e => {
    console.log(e);
    e.click();
  };

  /* Handle scenario when user clicks on chat to enter */
  handleChatSelect = e => {
    e.persist();
    // selected chat room data
    const holder = e.target.name.split("_");
    const data = { chatName: holder[0], chatId: holder[1] };
    fetch("/enterChat", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(res => {
        // chat was found and returned
        if (res.success && this._isMounted) {
          //console.log(res.chat);
          this.props.handleEnterChat(res.chat);
        }
      })
      .catch(err => console.log(err));
  };

  closeMenu = () => {
    this.setState({
      newChatOwner: "",
      chatsToJoin: []
    });
  };

  cardStyle = {
    marginBottom: "1em"
  };

  inputGroupStyle = {
    //marginBottom: '4em'
  };

  otherChatsStyle = {
    marginBottom: "2em"
  };

  render() {
    let hidden = "hidden";
    if (this.state.chatsToJoin.length) {
      hidden = null;
    }

    return (
      <div>
        <Row className="justify-content-md-center">
          <Col xs={12} md={8} style={this.inputGroupStyle}>
            <h3 className="text-center">{this.props.user.username}</h3>
            <InputGroup
              className="mb-3"
              onSubmit={this.handleCreateNewChatSubmit}
            >
              <FormControl
                autoFocus
                aria-describedby="basic-addon1"
                placeholder="Chat Name"
                value={this.state.newChatName}
                onChange={this.updateNewChatName}
                onKeyUp={e =>
                  e.keyCode === 13 ? this.handleCreateNewChatSubmit() : null
                }
              />
              <InputGroup.Prepend>
                <Button
                  variant="outline-secondary"
                  onClick={this.handleCreateNewChatSubmit}
                >
                  Create (+)
                </Button>
              </InputGroup.Prepend>
            </InputGroup>

            <InputGroup className="mb-3" style={this.inputGroupStyle}>
              <FormControl
                value={this.state.newChatOwner}
                onChange={this.updateNewChatOwner}
                onKeyUp={e => (e.keyCode === 13 ? this.getOtherChats() : null)}
                aria-describedby="basic-addon1"
                placeholder="Member's Username"
              />
              <InputGroup.Append>
                <Button
                  variant="outline-secondary"
                  onClick={this.getOtherChats}
                >
                  Join (+)
                </Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
        </Row>
        <Row
          className="justify-content-md-center"
          style={this.otherChatsStyle}
          hidden={hidden}
        >
          <Col xs={12} md={8}>
            <Card>
              <Card.Header>
                {this.newChatOwner + "'s Chats"}
                <Button
                  onClick={this.closeMenu}
                  className="float-right"
                  variant="danger"
                >
                  Cancel (x)
                </Button>
              </Card.Header>
              <Card.Body>
                <ButtonToolbar className="justify-content-md-center">
                  {this.state.chatsToJoin.length
                    ? this.state.chatsToJoin.map((chat, i) => {
                        return (
                          <Col key={i}>
                            <Button
                              key={i}
                              variant="outline-primary"
                              onClick={this.joinChat}
                              name={chat.chatName + "_" + chat._id}
                            >
                              {chat.chatName}
                            </Button>
                          </Col>
                        );
                      })
                    : null}
                </ButtonToolbar>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="justify-content-md-center">
          <Col xs={12} md={8}>
            <h4 className="text-center">Chats</h4>
            {this.state.chats
              .slice(0)
              .reverse()
              .map((chat, i) => {
                return (
                  <Card key={i} style={this.cardStyle}>
                    <Card.Body>
                      <Card.Title>{chat.chatName}</Card.Title>
                      <Card.Text>Owner: {chat.ownerUsername}</Card.Text>
                      <Card.Text>Id: {chat.chatId}</Card.Text>
                      <Button
                        variant="primary"
                        name={chat.chatName + "_" + chat.chatId}
                        onClick={this.handleChatSelect}
                      >
                        Enter
                      </Button>
                    </Card.Body>
                  </Card>
                );
              })}
          </Col>
        </Row>
      </div>
    );
  }
}

export default Main;
