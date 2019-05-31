import React, { Component } from "react";
import Message from "../Message";

class PreviewMessage extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.timer = [];
    this.state = { messages: {}, time: {} };
  }

  componentDidMount() {
    this._isMounted = true;
    this.props.socket.on("users-online", data => {
      let { messages } = this.state;
      (data[this.props.chatId]).forEach(user => {
        if (user !== this.props.username)
          messages[user] = '';
      });
      if (this._isMounted)
        this.setState( { messages: messages } );
      this.props.scrollToBottom();
    });

    this.props.socket.on("preview-message", data => {
      let { messages } = this.state;
      messages[data.username] = data.message;
      if (this._isMounted)
        this.setState( { messages: messages } );
      //this.props.scrollToBottom();
    });

    // lost text focus
    this.props.socket.on("user-left-chat", data => {
      let { messages } = this.state;
      delete messages[data.username];
      if (this._isMounted)
        this.setState( { messages: messages } );
    })

    this.props.socket.on("user-entered-chat", data => {
      let { messages } = this.state;
      messages[data.username] = '';
      if (this._isMounted)
        this.setState ( { messages: messages } );
      try {
        this.props.scrollToBottom();
      }
      catch {

      }

    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }
  previewMessage = data => { };

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
