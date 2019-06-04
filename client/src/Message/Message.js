import React, { Component } from "react";
import Card from "react-bootstrap/Card";

class Message extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { src } = this.props;
    const { contentType } = this.props;
    const { show } = this.props;
    const { name } = this.props;
    let x = "";
    if (show) x = show.toString();
    return (
      <Card
        bg={this.props.bg}
        text={this.props.text}
        style={this.props.style}
        show={x}
      >
        <Card.Body>
          <Card.Header>{this.props.username}</Card.Header>
          {contentType.includes("text") ? (
            this.props.message
          ) : contentType.includes("image") ? (
            <img src={src} alt={name} />
          ) : contentType.includes("audio") ? (
            <audio controls>
              <source src={src} type={contentType} />
              Your browser does not support the audio element.
            </audio>
          ) : contentType.includes("video") ? (
            <video controls>
              <source src={src} type={contentType} />
              Your browser does not support the video tag [ translation: 'you
              suck!'].
            </video>
          ) : contentType ? (
            <object data={src} type={contentType}>
              <iframe
                src={`https://docs.google.com/viewer?url=${src}&embedded=true`}
              />
            </object>
          ) : null}
        </Card.Body>
      </Card>
    );
  }
}

export default Message;
