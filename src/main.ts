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
const DESCRIPTION = process.env.DESCRIPTION

export const getXnftHolders = async () => {
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

  return await connection.getParsedProgramAccounts(
    new PublicKey(XNFT_PROGRAM_ID),
    {
      filters,
    }
  )
}
