import React, { Component } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

class Welcome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      username: "",
      password: "",
      createAccount: true,
      errorMessage: ""
    };
  }

  componentDidMount() {
    this.checkIfLoggedIn();
  }

  /* Check to see if the browser has the user's log in info stored */
  checkIfLoggedIn = () => {
    fetch("/user", {
      method: "GET",
      headers: {
        "Content-Type": "applicaton/json"
      }
    })
      .then(res => res.json())
      .then(res => {
        if (res.success === true) {
          const user = res.user;
          this.setState({
            email: user.email,
            username: user.username,
            password: user.password,
            createAccount: false
          });
        }
      })
      .catch(err => alert(err));
  };

  // login / create account
  postData = (url, data) => {
    let state = this.state;
    fetch(url, {
      method: "POST",
      body: JSON.stringify({
        email: state.email,
        username: state.username,
        password: state.password
      }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (state.createAccount) {
            if (data.duplicate === true || data.suceess === false)
              this.setState({ createAccount: true });
            else this.setState({ createAccount: false });
          } else if (!state.createAccount) {
            if (data.success === true) this.props.handleLogin(data);
            else {
              this.setState({ errorMessage: data.message });
            }
          }
        } else {
          alert("Username Taken");
        }
      })
      .catch(error => {
        alert("error", error);
      });
  };

  handleSubmit = e => {
    const state = this.state;
    let data = {
      email: state.email,
      username: state.username,
      password: state.password
    };
    let url = "";
    if (state.createAccount) url = "/create-account";
    else url = "/login";
    this.postData(url, data);
    e.preventDefault();
  };

  updateEmail = e => {
    e.persist();
    this.setState({ email: e.target.value });
  };

  updateUsername = e => {
    e.persist();
    this.setState((state, props) => ({
      username: e.target.value
    }));
  };

  updatePassword = e => {
    e.persist();
    this.setState({ password: e.target.value });
  };

  handleChangeMenu = () => {
    let x = !this.state.createAccount;
    this.setState((state, props) => ({
      createAccount: x
    }));
  };

  createAccount = () => {
    return (
      <div className="form-group">
        <label htmlFor="email">Email: </label>
        <input
          type="text"
          value={this.state.email}
          onChange={this.updateEmail}
          className="form-control"
          id="email"
          aria-describedby="emailHelp"
          placeholder="Enter Email"
        />
      </div>
    );
  };

  render() {
    const { createAccount } = this.state;
    let res = null;
    if (this.state.createAccount === true) {
      res = this.createAccount();
    }
    return (
      <Row className="justify-content-md-center">
        <Col xs={12} md={6} style={this.inputGroupStyle}>
          <form onSubmit={this.handleSubmit}>
            <div>
              <h1>{createAccount ? "Create An Account" : "Sign In"}</h1>
            </div>
            <div className="form-group">{res}</div>
            <div className="form-group">
              <label htmlFor="username">Username: </label>
              <input
                type="text"
                autoFocus
                value={this.state.username}
                onChange={this.updateUsername}
                className="form-control"
                id="username"
                aria-describedby="usernameHelp"
                placeholder="Enter Username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password: </label>
              <input
                type="password"
                value={this.state.password}
                onChange={this.updatePassword}
                className="form-control"
                id="password"
                aria-describedby="passwordHelp"
                placeholder="Enter Password"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {createAccount ? "Create Account" : "Sign In"}
            </button>
          </form>
          <div>
            <p>
              {createAccount ? "Have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleChangeMenu}
              >
                {createAccount ? "Sign In" : "Create Account"}
              </button>
            </p>
          </div>
        </Col>
      </Row>
    );
  }
}

export default Welcome;
