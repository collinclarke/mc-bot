# mc-bot

### To get started:
#### Set up your environment:
- Create a `.env` file
- Example `.env` content: ```BOT_USERNAME=yourbotemail
BOT_PASSWORD=yourbotpassword
AZYROS_ADDRESS=206.221.176.213
ALLOW_LIST=yourusername,someoneelsesusername,etc```
- run `npm i`
- run `npm run launch`


Recommend that you install eslint for vscode in order to get linting.

If you are unsure about a new package or bit of code you are introducing, create a new branch and push it there first.


WARNING: prismarine-viewer is not supported by all dev clients due to nodejs issues(?)
The branch to launch a viewer is called `viewer` and should not be updated with critical code. (Push to `master` instead and then merge `master` into `viewer`)