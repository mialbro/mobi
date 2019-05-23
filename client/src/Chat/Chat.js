import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import ButtonToolbar from "react-bootstrap/Row";

class Chat extends Component {
  constructor(props) {
    super(props);
    this.text = 0;
    this.state = {
      newMessage: "",
      newMessages: [],
      textarea: 0
    };
  }

  componentDidMount() {
    // send chat id to server to create private message flow
    this.props.socket.emit("chat online", this.props.chat._id);
    this.props.socket.on("message sent", data => {
      console.log(data);
      this.addMessage(data);
    });

    this.props.socket.on("error sending message", () => {
      console.log("error");
    });
  }

  sendMessage = e => {
    const { chat } = this.props;
    const { user } = this.props;
    const { newMessage } = this.state;
    const data = {
      chatId: chat._id,
      message: {
        email: user.email,
        username: user.username,
        message: newMessage,
        timeStamp: new Date()
      }
    };
    this.props.socket.emit("new message", data);
    this.setState({ newMessage: "" });
  };

  addMessage = data => {
    this.setState((prevState, props) => {
      return {
        newMessages: prevState.newMessages.concat([data])
      };
    });
  };

  updateMessage = e => {
    e.persist();
    this.setState({ newMessage: e.target.value });
  };

  msgHeight = e => {
    this.setState({ textarea: e.scrollHeight });
    //this.text = e.scrollHeight;
  };

  sendMessageStyle = {
    position: "fixed",
    bottom: 0,
    width: "70%",
    height: "100vh" /* Magic here */,
    display: "flex",
    "justify-content": "center",
    "align-items": "flex-end"
  };

  messageStyles: {
    marginBottom: "10em"
  };

  updateTextareaHeight = e => {
    console.log(this.textInput.current.scrollHeight);
    this.setState({ textareaHeight: this.textInput.current.scrollHeight });
  };

  render() {
    return (
      <div style={{ marginBottom: "4em" }}>
        <Row className="justify-content-md-center">
          <Col xs={12} md={8}>
            <ButtonToolbar>
              <Button variant="primary" onClick={this.props.goHome}>
                Chats
              </Button>
            </ButtonToolbar>
          </Col>
        </Row>
        <Row className="justify-content-md-center">
          <Col xs={12} md={8}>
            <h4 className="text-center">{this.props.chat.chatName}</h4>
            {this.props.chat.messages.map((data, i) => {
              return (
                <InputGroup key={i} className="mb-3">
                  <InputGroup.Prepend>
                    <InputGroup.Text id="basic-addon3">
                      {data.username}
                    </InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl
                    as="textarea"
                    id="basic-url"
                    aria-describedby="basic-addon3"
                    value={data.message}
                    disabled
                  />
                </InputGroup>
              );
            })}
            {this.state.newMessages.map((data, i) => {
              return (
                <InputGroup key={i} className="mb-3">
                  <InputGroup.Prepend>
                    <InputGroup.Text id="basic-addon3">
                      {data.username}
                    </InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl
                    id="basic-url"
                    aria-describedby="basic-addon3"
                    value={data.message}
                    disabled
                  />
                </InputGroup>
              );
            })}
          </Col>
        </Row>

        <Row
          className="justify-content-md-center"
          style={{ marginLeft: "auto", marginRight: "auto", bottom: 0 }}
        >
          <Col xs={12} md={8}>
            <InputGroup className="mb-3" onSubmit={this.sendMessage}>
              <FormControl
                autoFocus
                aria-describedby="basic-addon1"
                placeholder="Message"
                value={this.state.newMessage}
                onChange={this.updateMessage}
                onKeyUp={e => (e.keyCode === 13 ? this.sendMessage() : null)}
              />
              <InputGroup.Append>
                <Button variant="outline-secondary" onClick={this.sendMessage}>
                  Send
                </Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Chat;
