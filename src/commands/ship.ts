import { GluegunCommand } from 'gluegun'
import { createReadStream } from 'fs'
import { WebClient } from '@slack/web-api'

import { Readable } from 'stream'

const command: GluegunCommand = {
  name: 'ship',
  description: 'Post your project to #ship, #scrapbook, or both!',
  run: async toolbox => {
    const {
      print,
      parameters,
      prompt: { ask }
    } = toolbox

    const channels = {
      '#ship': 'C0M8PUPU6',
      '#scrapbook': 'C01504DCLVD'
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

    let stream: Readable
    try {
      stream = createReadStream(parameters.first)
    } catch (e) {
      print.error("I couldn't access that file. :(")
    }

    let uploadSpinner = print.spin()

    let uploadResp = await slack.files.upload({
      file: stream,
      channels: selectedChannels,
      initial_comment: text
    })

  }
}

module.exports = command
