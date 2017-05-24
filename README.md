# TACOS

Implementing functionality that is missing in TeamCity

# Configuration

Copy the `server.json-template` to `server.json`. The username and password is a TeamCity user with sufficient privileges to start a build. Hostname and port are the same as the address used to access TeamCity web UI.

    {
      "hostname": "127.0.0.1",
      "port" : 80,
      "username": "username",
      "password": "password"
    }


# License

MIT
