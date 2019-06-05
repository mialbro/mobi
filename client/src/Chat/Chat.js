import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import ButtonToolbar from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Message from "../Message";
import PreviewMessage from "../PreviewMessage";
import PopUp from "../Modal/Modal";

class Chat extends Component {
  constructor(props) {
    super(props);
    this.text = 0;
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    this.state = {
      newMessage: "",
      newMessages: [],
      textarea: 0,
      width: 0,
      height: 0,
      uploadMedia: false,
      media: {},
      loading: false
    };
  }

  scrollToBottom = () => {
    try {
      this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    } catch (e) {}
  };

  componentDidMount() {
    this.scrollToBottom();

    this.props.socket.on("TEST", data => {
      alert("TEST!!!");
      //this.setState( { media: data } );
    });

    // send chat id to server to create private message flow
    this.props.socket.emit("user-entered-chat", {
      chatId: this.props.chat._id,
      userId: this.props.user.id,
      username: this.props.user.username
    });

    this.props.socket.on("message-sent", message => {
      this.scrollToBottom();
      this.props.handleNewMessage(message);
    });

    this.props.socket.on("error sending message", () => {});
    window.addEventListener("resize", this.updateWindowDimensions.bind(this));
    this.updateWindowDimensions();
  }

  componentDidUpdate = () => {
    this.scrollToBottom();
  };

  componentWillUnmount() {
    window.removeEventListener(
      "resize",
      this.updateWindowDimensions.bind(this)
    );
  }

  updateWindowDimensions() {
    this.setState({ height: window.innerHeight, width: window.innerWidth });
  }

  sendMessage = e => {
    const { chat } = this.props;
    const { newMessage } = this.state;
    const data = {
      chatId: chat._id,
      userId: this.props.user.id,
      message: newMessage,
      timeStamp: new Date()
    };
    this.props.socket.emit("new-message", data);
    this.setState({ newMessage: "" });
  };

  updateMessage = e => {
    e.persist();
    this.setState({ newMessage: e.target.value });
  };

  updateTextareaHeight = e => {
    this.setState({ textareaHeight: this.textInput.current.scrollHeight });
  };

  leaveChat = () => {
    this.props.socket.emit("left-chat");
    this.props.goHome();
  };

  BackStyles = {
    "margin-left": "auto",
    "margin-right": "auto",
    width: "20%"
  };

  allowDrop = e => {
    e.preventDefault();
  };

  drop = e => {
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      let f = files[i];
      console.log(f);
    }
    e.preventDefault();
  };

  enableMediaUpload = e => {
    this.setState({ uploadMedia: true });
  };

  disableMediaUpload = e => {
    this.setState({ uploadMedia: false });
  };

  handleLoading = () => {
    this.setState( { loading: true } );
  }

  handleDone = () => {
    this.setState( { loading: false } );
  }

  render() {
    return (
      <div height={{ height: "100%" }}>
        <Row className="justify-content-md-center">
          <Col xs={12} md={8}>
            <ButtonToolbar styles={this.buttonStyles}>
              <Button variant="primary" onClick={this.leaveChat}>
                Back
              </Button>
            </ButtonToolbar>
          </Col>
        </Row>
        <h3 className="text-center">chat: {this.props.chat.chatName}</h3>
        <h3 className="text-center">username: {this.props.user.username} </h3>
        <Row
          className="justify-content-md-center"
          style={{
            overflow: "scroll",
            width: "auto",
            height: this.state.height / 2 + "px"
          }}
        >
          <Col xs={12} md={8}>
            {this.props.chat.messages.map((data, i) => {
              return (
                <Message
                  key={i}
                  username={this.props.members[data.userId]}
                  message={data.message}
                  value={data.message}
                  contentType={data.contentType}
                  src={data.src}
                  show={data.show}
                  name={data.name}
                />
              );
            })}
            <PreviewMessage
              username={this.props.user.username}
              chatId={this.props.chat._id}
              socket={this.props.socket}
              scrollToBottom={this.scrollToBottom}
            />
            <div
              style={{ float: "left", clear: "both" }}
              ref={el => {
                this.messagesEnd = el;
              }}
            />
          </Col>
        </Row>

        <Row
          className="justify-content-md-center"
          style={{ marginLeft: "auto", marginRight: "auto", bottom: 0 }}
        >
          <Col xs={12} md={8}>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <PopUp
                  socket={this.props.socket}
                  chatId={this.props.chat._id}
                  id={this.props.user.id}
                  handleLoading={this.handleLoading}
                  handleDone={this.handleDone}
                  loading={this.state.loading}
                />
              </InputGroup.Prepend>
              <FormControl
                autoFocus
                disabled={this.state.loading}
                onKeyUp={this.props.socket.emit("preview-message", {
                  message: this.state.newMessage,
                  username: this.props.user.username,
                  chatId: this.props.chat._id
                })}
                aria-describedby="basic-addon1"
                placeholder="Message"
                value={this.state.newMessage}
                onChange={this.updateMessage}
                onKeyUp={e => (e.keyCode === 13 ? this.sendMessage() : null)}
              />
              <InputGroup.Append>
                <Button variant="outline-secondary" onClick={this.sendMessage} disabled={this.state.loading}>
                  Send
                  {
                    this.state.loading ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : null
                  }
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
