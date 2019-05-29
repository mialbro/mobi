import React, { Component } from "react";
import Card from "react-bootstrap/Card";

class Message extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <Card bg={this.props.bg} text={this.props.text} style={this.props.style}>
        <Card.Body>
          <Card.Header>{this.props.username}</Card.Header>
          {this.props.message}
        </Card.Body>
      </Card>
    );
  }
}

export default Message;
