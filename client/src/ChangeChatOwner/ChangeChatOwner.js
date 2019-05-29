import React, { Component } from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";

class ChangeChatOwner extends Component {
  constructor(props) {
    super(props);
    this.state = { members: [] };
  }

  componentDidMount() {
    this.getMembers();
  }

  /* Get the members of the chat */
  getMembers = () => {
    fetch("/get-chat-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: this.props.chatId })
    })
      .then(res => res.json())
      .then(res => {
        this.setState({ members: res.members });
      });
  };

  /* Change the chat owner */
  changeChatOwner = e => {
    const data = {
      chatId: this.props.chatId,
      username: e.target.name
    };
    fetch("/change-chat-owner", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) this.props.update();
      });
  };

  render() {
    return (
      <Card>
        <Card.Header>
          <Button
            onClick={this.props.cancel}
            className="float-right"
            variant="danger"
          >
            Cancel (x)
          </Button>
        </Card.Header>
        <Card.Body>
          <ButtonToolbar className="justify-content-md-center">
            {this.state.members.map((member, i) => {
              return (
                <Col key={i}>
                  <Button
                    key={i}
                    variant="outline-primary"
                    onClick={this.changeChatOwner}
                    name={member.username}
                  >
                    {member.username}
                  </Button>
                </Col>
              );
            })}
          </ButtonToolbar>
        </Card.Body>
      </Card>
    );
  }
}

export default ChangeChatOwner;
