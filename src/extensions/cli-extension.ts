import { GluegunToolbox } from 'gluegun'
import { join } from 'path'

// add your CLI-specific functionality here, which will then be accessible
// to your commands
module.exports = (toolbox: GluegunToolbox) => {
  const { filesystem } = toolbox

  const configFile = join(filesystem.homedir(), '.ship-cli', 'config.json')

  toolbox.store = {
    set: async (key: string, value: any) => {
      let loadedConfig = {}

      if (await filesystem.existsAsync(configFile)) {
        loadedConfig = await filesystem.readAsync(configFile, 'json')
      }

      loadedConfig[key] = value
      await filesystem.writeAsync(configFile, loadedConfig)
    },
    get: async (key: string) => {
      let loadedConfig = await filesystem.readAsync(configFile, 'json')

      return loadedConfig ? loadedConfig[key] || null : null
    },
    delete: async (key: string) => {
      let loadedConfig = await filesystem.readAsync(configFile, 'json')

      if (loadedConfig) {
        delete loadedConfig[key]
        await filesystem.writeAsync(configFile, loadedConfig)
      }
    }
  }

  // enable this if you want to read configuration in from
  // the current folder's package.json (in a "ship" property),
  // ship.config.json, etc.
  // toolbox.config = {
  //   ...toolbox.config,
  //   ...toolbox.config.loadConfig(process.cwd(), "ship")
  // }
}
