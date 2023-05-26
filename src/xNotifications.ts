import {
  Connection,
  GetProgramAccountsFilter,
  PublicKey,
} from '@solana/web3.js'
import path from 'path'
import * as dotenv from 'dotenv'
import data from '../data/example-holders-snapshot.json'
import fs from 'fs'

type UserInfo = {
  user: {
    id: string
    username: string
    public_keys: {
      blockchain: string
      public_key: string
    }[]
  }
}

export class xNotifications {
  private cacheFilePath: string
  private RPC: string | undefined
  private XNFT_PROGRAM_ID: string | undefined
  private MINT: string | undefined
  private TITLE: string | undefined
  private MESSAGE: string | undefined
  private USER_INFO_ENDPOINT: string | undefined
  private PUSH_NOTIFICATION_ENDPOINT: string | undefined
  private SECRET: string | undefined

  constructor() {
    const envPath = path.resolve(__dirname, '..', '.env')
    dotenv.config({ path: envPath })

    this.RPC = process.env.RPC
    this.XNFT_PROGRAM_ID = process.env.XNFT_PROGRAM_ID
    this.MINT = process.env.MINT
    this.TITLE = process.env.TITLE
    this.MESSAGE = process.env.MESSAGE
    this.USER_INFO_ENDPOINT = process.env.USER_INFO_ENDPOINT
    this.PUSH_NOTIFICATION_ENDPOINT = process.env.PUSH_NOTIFICATION_ENDPOINT
    this.SECRET = process.env.SECRET
    this.cacheFilePath = path.resolve(__dirname, '../data', 'userCache.json')
  }

  private async getXnftHolders(): Promise<string[] | undefined> {
    if (!this.RPC || !this.XNFT_PROGRAM_ID || !this.MINT) {
      console.log(
        `${
          !this.RPC
            ? 'RPC is not defined'
            : !this.XNFT_PROGRAM_ID
            ? 'XNFT_PROGRAM_ID is not defined'
            : 'XNFT_MINT is not defined'
        }`
      )
      return
    }

    const connection = new Connection(this.RPC, 'confirmed')
    const xnft_key = PublicKey.findProgramAddressSync(
      [Buffer.from('xnft'), new PublicKey(this.MINT).toBytes()],
      new PublicKey(this.XNFT_PROGRAM_ID)
    )[0]

    const filters: GetProgramAccountsFilter[] = [
      {
        dataSize: 8 + 32 * 3 + 8 + 64,
      },
      {
        memcmp: {
          offset: 8 + 32,
          bytes: xnft_key.toBase58(),
        },
      },
    ]

    const programAccounts = await connection.getProgramAccounts(
      new PublicKey(this.XNFT_PROGRAM_ID),
      {
        filters,
      }
    )

    return programAccounts.map((account) => account.pubkey.toBase58())
  }

  private async getUserInfo(user: PublicKey): Promise<any | undefined> {
    if (!this.USER_INFO_ENDPOINT) {
      console.log('USER_INFO_ENDPOINT is not defined')
      return
    }

    const response = await fetch(
      `${this.USER_INFO_ENDPOINT}?publicKey=${user.toBase58()}`
    )
    if (response.status === 200) {
      const userInfo: UserInfo = await response.json()
      return userInfo.user.id
    } else {
      console.log(
        `No user found: ${user.toBase58()}, Response:${response.status}`
      )
    }
  }

  async push(userIds: string[]): Promise<void> {
    if (!this.PUSH_NOTIFICATION_ENDPOINT || !this.SECRET) {
      console.log(
        `${
          !this.PUSH_NOTIFICATION_ENDPOINT
            ? 'PUSH_NOTIFICATION_ENDPOINT is not defined'
            : 'SECRET is not defined'
        }`
      )
      return
    }

    console.log(userIds, this.TITLE, this.MESSAGE)

    const requestBody = JSON.stringify({
      userIds,
      title: this.TITLE,
      body: this.MESSAGE,
    })

    const response = await fetch(this.PUSH_NOTIFICATION_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `secret ${this.SECRET}`,
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(requestBody, 'utf8')),
      },
      body: requestBody,
    })

    const responseMessage = await response.text() // Extract the response message

    console.log(
      `Push notification ${
        response.status === 200
          ? `sent successfully. Response: ${responseMessage}`
          : `error sending push notification: ${response.status}. Response: ${responseMessage}`
      }`
    )
  }

  public async runApp(): Promise<void> {
    const holders = await this.getXnftHolders()
    if (!holders) {
      return // or handle the case when holders is undefined
    }

    const userIds = await Promise.all(
      holders.map(async (holder) => {
        const userInfo = await this.getUserInfo(new PublicKey(holder))
        return userInfo?.user?.id
      })
    )

    if (userIds.length > 0) {
      await this.push(userIds)
    }
  }

  public async runCollection(batchSize: number, delay: number): Promise<void> {
    const holders = data as string[]

    const requests = holders.map(
      (holder) => () => this.getUserInfo(new PublicKey(holder))
    )

    const results = await this.batchFetchWithDelay(requests, batchSize, delay)

    const userIds = results.filter((result) => result !== undefined) as string[]

    this.updateUserCache(userIds)

    if (userIds.length) {
      await this.push(userIds)
    }
  }

  private async batchFetchWithDelay(
    requests: (() => Promise<any>)[],
    batchSize: number,
    delay: number
  ): Promise<any[]> {
    const results: any[] = []

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map((request) => request()))
      results.push(...batchResults)
      await this.delayExecution(delay)
    }

    return results
  }

  private async delayExecution(delay: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delay))
  }

  private loadUserCache(): string[] | undefined {
    try {
      const cacheData = fs.readFileSync(this.cacheFilePath, 'utf8')
      return JSON.parse(cacheData) as string[]
    } catch (error) {
      console.log('Error loading user cache:', error)
      return undefined
    }
  }

  private updateUserCache(userIds: string[]): void {
    try {
      const cache = this.loadUserCache() || []
      cache.push(...userIds)
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(cache))
    } catch (error) {
      console.log('Error updating user cache:', error)
    }
  }
}
