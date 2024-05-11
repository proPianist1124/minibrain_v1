## Todo
1. Rewrite codebase to sveltekit
2. Add `upload` to top of folder instead to provide better UX

# MiniBrain CDN
> **We suggest using [Pinggy](https://pinggy.io) to host your MiniBrain Instance**

## Setting Up
Go to the `config.json` file and edit the configuration for your MiniBrain as you wish. If you enable `protected`, please create a `.env` file and populate it with the environment variable `PASSWORD=<your_password>`. Therefore, when others try to access your MiniBrain instance, they will be met with a password input.

## Starting the Server
Go to your terminal and enter `npm run start`, which should start running the production build. If you're interested customizing MiniBrain, run `npm run dev`, which will start a nodemon instance where every change you make will be part of the instance.

## Hosting
Run `ssh -p 443 -R0:localhost:3000 -L4300:localhost:4300 qr@a.pinggy.io` in your terminal and you should get a custom domain for your MiniBrain instance! To check the web debugger, go to [localhost:4300](http://localhost:4300)