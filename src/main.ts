import {
  Connection,
  GetProgramAccountsFilter,
  PublicKey,
} from '@solana/web3.js'
import path from 'path'
import * as dotenv from 'dotenv'

const envPath = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

const RPC = process.env.RPC
const XNFT_PROGRAM_ID = process.env.XNFT_PROGRAM_ID
const MINT = process.env.MINT
const TITLE = process.env.TITLE
const MESSAGE = process.env.MESSAGE
const USER_INFO_ENDPOINT = process.env.USER_INFO_ENDPOINT
const PUSH_NOTIFICATION_ENDPOINT = process.env.PUSH_NOTIFICATION_ENDPOINT
const SECRET = process.env.SECRET

const getXnftHolders = async () => {
  if (!RPC) {
    console.log('RPC is not defined')
    return
  }
  if (!XNFT_PROGRAM_ID) {
    console.log('XNFT_PROGRAM_ID is not defined')
    return
  }
  if (!MINT) {
    console.log('XNFT_MINT is not defined')
    return
  }

  const connection = new Connection(RPC, 'confirmed')
  const xnft_key = PublicKey.findProgramAddressSync(
    [Buffer.from('xnft'), new PublicKey(MINT).toBytes()],
    new PublicKey(XNFT_PROGRAM_ID)
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

  return await connection.getProgramAccounts(new PublicKey(XNFT_PROGRAM_ID), {
    filters,
  })
}

const getUserInfo = async (user: PublicKey) => {
  if (!USER_INFO_ENDPOINT) {
    console.log('USER_INFO_ENDPOINT is not defined')
    return
  }
  const response = await fetch(
    `${USER_INFO_ENDPOINT}?publicKey=${user.toBase58()}`
  )
  if (response.status === 200) {
    return await response.json()
  } else {
    console.log(
      `Error fetching user info: ${user.toBase58()}, ${response.status}`
    )
    return
    // write to cache
  }
}

async function push(userIds: string[]) {
  if (!PUSH_NOTIFICATION_ENDPOINT) {
    console.log('USER_INFO_ENDPOINT is not defined')
    return
  }

  if (!SECRET) {
    console.log('SECRET is not defined')
    return
  }

  const response = await fetch(PUSH_NOTIFICATION_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `secret ${SECRET}`,
    },
    body: JSON.stringify({
      userIds,
      TITLE,
      MESSAGE,
    }),
  })

  if (response.status === 200) {
    console.log('Push notification sent successfully')
  } else {
    console.log('Error sending push notification')
  }
}

export const run = async () => {
  const holders = await getXnftHolders()
  const userIds = await holders?.map(async (holder) => {
    const dataBuffer = holder.account.data as Buffer
    const userInfo = await getUserInfo(
      new PublicKey(dataBuffer.slice(8, 8 + 32))
    )
    return userInfo?.user?.id
  })
  // push notification
  // await push(userIds)
}

run()
