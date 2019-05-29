import React, { Component } from "react";
import Message from "../Message";

class PreviewMessage extends Component {
  constructor(props) {
    super(props);
    this.timer = [];
    this.state = { messages: {}, time: {} };
  }

  componentDidMount() {
    this.props.socket.on("preview-message", data => {
      this.previewMessage(data);
      this.props.scrollToBottom();
    });
  }

  /* Show all of the users what each person is typing */
  previewMessage = data => {
    let { messages } = this.state;
    // if text has not changed return early
    //if (messages[data.username] === data.message)
    //return;

    // if all of the text was removed, hide the message preview
    if (data.message.length === 0) {
      delete messages[data.username];
      this.setState({ messages: messages });
      return;
    }

    // update the message preview
    else {
      // reset timer so message preview will be shown for 2 seconds
      clearTimeout(this.timer[data.username]);
      messages[data.username] = data.message;
      //times[data.username] = Date.now();
    }
    // update the message and clear it in 2 seconds
    this.setState(
      prevState => ({
        messages: messages
      }),
      () => {
        this.timer[data.username] = setTimeout(() => {
          delete messages[data.username];
          this.setState({ messages: messages });
        }, 2000);
      }
    );
  };

  style = {
    //'position': 'absolute'
  };

  render() {
    const { messages } = this.state;
    return (
      <div>
        {Object.keys(messages).map((key, i) => {
          return (
            <Message
              style={this.style}
              key={i}
              bg={"success"}
              text={"white"}
              username={key}
              message={messages[key]}
              value={messages[key]}
            />
          );
        })}
      </div>
    );
  }
}

export default PreviewMessage;
