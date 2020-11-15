import BasicBot from "./BasicBot"

export default class AuthenticatedBot extends BasicBot {
  allowedUsers: Record<string, { listening: boolean }> = {}

  initPlugins() {
    super.initPlugins()
    this.authorize(process.env.ALLOW_LIST)
  }
  
  private authorize (usernameList: string): void {
    usernameList.split(',').forEach((username) => {
      this.allowedUsers[username] = {
        listening: true,
      }
    })
  }

  private setListen (username: string, listening: boolean) {
    if (this.allowedUsers[username]) {
      this.allowedUsers[username].listening = listening
      return true
    }
    return false
  }

  private isListening(username:string) {
    return this.allowedUsers[username] && this.allowedUsers[username].listening
  }

}