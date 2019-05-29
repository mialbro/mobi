import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

class UpdateChatName extends Component {
  constructor(props) {
    super(props);
    this.state = { newName: "" };
  }

  changeName = () => {
    fetch("/change-chat-name", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({
        newChatName: this.state.newName,
        chatId: this.props.chatId
      })
    }).then(res => {
      this.props.update();
    });
  };

  updateNameChange = e => {
    e.persist();
    this.setState({ newName: e.target.value });
  };

  cancel = () => {
    this.setState({ newName: "" });
    this.props.cancel();
  };

  handleFormSubmit = e => {
    e.preventDefault();
    this.changeName();
  };

  render() {
    return (
      <Form onSubmit={this.handleFormSubmit}>
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Rename Chat</Form.Label>
          <Form.Control
            placeholder="Enter New Name"
            onChange={this.updateNameChange}
          />
          <Button variant="primary" onClick={this.changeName}>
            Rename
          </Button>
          <Button variant="primary" onClick={this.cancel}>
            Cancel
          </Button>
        </Form.Group>
      </Form>
    );
  }
}

export default UpdateChatName;
