import { GluegunCommand } from 'gluegun'
import * as express from 'express'
import * as open from 'open'
import config from '../config'
import { WebClient } from '@slack/web-api'

let slack = new WebClient()

const command: GluegunCommand = {
  name: 'login',
  description: 'Log into Slack',
  run: async toolbox => {
    const url = `https://slack.com/oauth/v2/authorize?user_scope=files:write&client_id=${config.client_id}&redirect_uri=http://localhost:9000/callback`

    let openSpinner = toolbox.print.spin(
      toolbox.print.colors.muted('Opening URL in browser: ') + url
    )
    await open(url)

    let app = express()
    app.get('/callback', async (req, res) => {
      const code = req.query.code

      res.send('Almost there! Please head on back to your terminal.')
      openSpinner.succeed()

      server.close()
      app.removeAllListeners()

      let tokenSpinner = toolbox.print.spin('Getting auth token...')

      let tokenResp = await slack.oauth.v2.access({
        code: code as string,
        client_id: config.client_id,
        client_secret: config.client_secret,
        redirect_uri: 'http://localhost:9000/callback'
      })

      const token = (tokenResp.authed_user as any).access_token

      tokenSpinner.succeed()

      toolbox.store.set('token', token)

      toolbox.print.success(
        "You've been successfully logged in! " +
          toolbox.print.colors.muted('Finishing up...')
      )
    })
    let server = app.listen(9000)
  }
}

module.exports = command
