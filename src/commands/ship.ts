import { GluegunCommand } from 'gluegun'
import { createReadStream } from 'fs'
import { WebClient, ErrorCode } from '@slack/web-api'

import { Readable } from 'stream'

const command: GluegunCommand = {
  name: 'ship',
  description: 'Post your project to various Slack channels!',
  run: async toolbox => {
    const {
      print,
      parameters,
      prompt: { ask },
      filesystem: { existsAsync }
    } = toolbox

    const channels = {
      '#ship': 'C0M8PUPU6',
      '#scrapbook': 'C01504DCLVD',
      '#wip': 'CCU43K0PK'
    }

    const token = await toolbox.store.get('token')

    if (!token) {
      print.error('Please login to Slack with `ship login`.')
      return
    }

    const slack = new WebClient(token)

    const file = parameters.first
    if (!file) {
      print.info('Please provide an image file, like `ship image.png`')
      return
    }

    let { text, channels: selectedChannels } = await ask([
      {
        type: 'input',
        name: 'text',
        message: 'Message Text'
      },
      {
        type: 'multiselect',
        name: 'channels',
        message: 'What channels do you want to post to? (<space> to select)',
        choices: Object.keys(channels)
      }
    ])

    if ((await existsAsync(parameters.first)) !== 'file') {
      print.error("I couldn't find that file :(")
      return
    }

    let stream: Readable = createReadStream(parameters.first)

    let uploadSpinner = print.spin('Uploading file to Slack...')

    try {
      await slack.files.upload({
        file: stream,
        channels: selectedChannels.map(i => channels[i]).join(','),
        initial_comment: text
      })
    } catch (e) {
      if (e.code === ErrorCode.PlatformError) {
        uploadSpinner.fail(
          `Uploading to Slack failed with error \`${e.data.error}\``
        )
      }
      return
    }

    uploadSpinner.succeed('Yay!')
  }
}

module.exports = command
