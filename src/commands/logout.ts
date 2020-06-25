import { GluegunCommand } from 'gluegun'

const command: GluegunCommand = {
  name: 'logout',
  description: 'Log out of Slack',
  run: async toolbox => {
    const { print } = toolbox

    await toolbox.store.delete('token')

    print.info("You've been successfully logged out!")
  }
}

module.exports = command
