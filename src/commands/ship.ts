import { GluegunCommand } from 'gluegun'
import { createReadStream } from 'fs'
import { WebClient, ErrorCode } from '@slack/web-api'
import axios from 'axios'

import { Readable } from 'stream'

const command: GluegunCommand = {
  name: 'ship',
  description: 'Post your project to various Slack channels!',
  run: async toolbox => {
    const {
      print,
      parameters,
      prompt: { ask, confirm },
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
      print.info('Please provide a file, like `ship image.png`')
      return
    }

    let questions: any = [
      {
        type: 'input',
        name: 'text',
        message: 'Message Text'
      }
    ]

    let channelParam = parameters.options.channel || parameters.options.channels

    if (!channelParam) {
      questions.push({
        type: 'multiselect',
        name: 'channels',
        message: 'What channels do you want to post to? (<space> to select)',
        choices: Object.keys(channels)
      })
    }

    let { text, channels: selectedChannels } = await ask(questions)

    if (!(await confirm('Are you ready to ship?'))) {
      print.error('Aborting. :(')
      return
    }

    let stream: Readable

    if (
      parameters.first.startsWith('http://') ||
      parameters.first.startsWith('https://')
    ) {
      // It be a URL
      try {
        stream = (await axios.get(parameters.first, { responseType: 'stream' }))
          .data
      } catch (e) {
        print.error("I couldn't access that file :(")
        return
      }
    } else {
      // It be a file
      if ((await existsAsync(parameters.first)) !== 'file') {
        print.error("I couldn't access that file :(")
        return
      }

      stream = createReadStream(parameters.first)
    }

    let uploadSpinner = print.spin('Uploading file to Slack...')

    try {
      await slack.files.upload({
        file: stream,
        channels:
          channelParam ||
          selectedChannels.map((i: string) => channels[i]).join(','),
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

    uploadSpinner.succeed('Your project has been successfully shipped!')
  }
}

module.exports = command
