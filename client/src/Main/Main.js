import React, { Component } from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import ButtonToolbar from "react-bootstrap/Row";
import UpdateChatName from "../UpdateChatName";
import ChangeChatOwner from "../ChangeChatOwner";
import ChangeUsername from "../ChangeUsername";
import Form from "react-bootstrap/Form";

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
      chatsToJoin: [],
      changeChatName: [],
      changeChatOwner: [],
      changeUsername: false
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this.props.getChats();
    this.setState({ username: this.props.user.username });
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
    this.setState({ newChat: false, newChatName: "" });
    this.props.createNewChat(data);
  };

  /* Gets the other user's chats */
  getOtherChats = () => {
    this.newChatOwner = this.state.newChatOwner;
    let data = { username: this.state.newChatOwner };
    this.props.socket.emit("get chats", data);
  };

  /* Join a chat that already exists */
  joinChat = e => {
    let holder = e.target.name.split("_");
    const data = {
      chatName: holder[0],
      chatId: holder[1],
      ownerUsername: this.newChatOwner
    };
    this.props.joinChat(data);
    this.setState({ join: false, newChatOwner: "", chatsToJoin: [] });
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
          this.props.handleEnterChat(res.chat, res.members);
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

  enableChangeChatOwner = e => {
    let update = [];
    this.props.chats.forEach(chat => {
      update.push(false);
    });
    update[e.target.name] = true;
    this.setState({ changeChatOwner: update });
  };

  cancelChangeChatOwner = e => {
    this.setState({ changeChatOwner: [] });
  };

  handleNewChatOwner = () => {
    this.props.getChats();
    this.setState({ changeChatOwner: [] });
  };

  enableChangeUsername = e => {
    this.setState({ changeUsername: true });
  };

  changeUsername = username => {
    this.setState({ username: username, changeUsername: false });
    this.props.handleUsernameChange(username);
  };

  cancelChangeUsername = () => {
    this.setState({ changeUsername: false });
  };

  handleChatNameChange = () => {
    this.props.getChats();
    this.setState({ changeChatName: [] });
  };

  cancelChatNameChange = () => {
    this.setState({ changeChatName: [] });
  };

  enableChatNameChange = e => {
    let update = [];
    this.props.chats.forEach(chat => {
      update.push(false);
    });
    update[e.target.name] = true;
    this.setState({ changeChatName: update });
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
            <h3 className="text-center">{this.props.user.username} </h3>
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
            <Button variant="primary" onClick={this.enableChangeUsername}>
              Change Username
            </Button>
          </Col>
        </Row>
        {this.state.changeUsername ? (
          <ChangeUsername
            update={this.changeUsername}
            cancel={this.cancelChangeUsername}
          />
        ) : null}
        <Row className="justify-content-md-center">
          <Col xs={12} md={8}>
            <h4 className="text-center">Chats</h4>
            {this.props.chats
              .slice(0)
              .reverse()
              .map((chat, i) => {
                return (
                  <Card key={i} style={this.cardStyle}>
                    <Card.Body>
                      <Card.Title>{chat.chatName}</Card.Title>
                      {this.props.user.id === chat.owner ? (
                        <h1>Owner</h1>
                      ) : null}
                      <Button
                        variant="primary"
                        name={chat.chatName + "_" + chat.chatId}
                        onClick={this.handleChatSelect}
                      >
                        Enter
                      </Button>
                      <Button
                        variant="primary"
                        name={chat.chatId}
                        onClick={this.props.handleLeaveChat}
                      >
                        Leave
                      </Button>
                      {this.props.user.id === chat.owner ? (
                        <div>
                          <Button
                            variant="primary"
                            name={chat.chatId}
                            onClick={this.props.handleChatDelete}
                          >
                            Delete
                          </Button>
                          <Button
                            name={i}
                            variant="primary"
                            onClick={this.enableChatNameChange}
                          >
                            Rename
                          </Button>
                          {this.state.changeChatName[i] === true ? (
                            <UpdateChatName
                              chatId={chat.chatId}
                              update={this.handleChatNameChange}
                              cancel={this.cancelChatNameChange}
                            />
                          ) : null}
                          <Button
                            variant="primary"
                            name={i}
                            onClick={this.enableChangeChatOwner}
                          >
                            Change Owner
                          </Button>
                          {this.state.changeChatOwner[i] === true ? (
                            <ChangeChatOwner
                              chatId={chat.chatId}
                              update={this.handleNewChatOwner}
                              cancel={this.cancelChangeChatOwner}
                            />
                          ) : null}
                        </div>
                      ) : null}
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
