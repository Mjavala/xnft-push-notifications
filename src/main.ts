import fs from 'fs'
import { Command } from 'commander'
import { xNotifications } from './xNotifications'

// CLI
const xN = new xNotifications()

const program = new Command()
program.version('1.0.0')

program
  .command('app')
  .description('Run app')
  .action(() => xN.runApp())

program
  .command('collection')
  .description('Run collection')
  .option('-b, --batch-size <number>', 'Batch size', '100')
  .option(
    '-d, --delay <number>',
    'Delay between batches in milliseconds',
    '1000'
  )
  .option('-c, --cache <filePath>', 'Enable cache')
  .action((options) => {
    const batchSize = Number(options.batchSize)
    const delayBetweenBatches = Number(options.delay)
    const cacheFilePath = options.cache

    if (cacheFilePath) {
      const cacheData = fs.readFileSync(cacheFilePath, 'utf8')
      const cache = JSON.parse(cacheData)
      if (
        Array.isArray(cache) &&
        cache.every((item) => typeof item === 'string')
      ) {
        xN.push(cache)
      } else {
        console.log(
          'Invalid cache format. Cache should be an array of strings.'
        )
      }
    } else {
      xN.runCollection(batchSize, delayBetweenBatches)
    }
  })

program.parse(process.argv)
