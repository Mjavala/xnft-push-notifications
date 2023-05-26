# xnft-push-notifications
Push notification tool for both app and collectibles xnfts.

## Setup

- Configure your environment (see example.env)

### App
For any standalone xNFTs, or xdapps, you will need to get the underlying NFT's mint address. [Here's](https://www.xnft.gg/app/HBtfDDdrs4jz29VZHr8fw1TJjE2U4kQDnHfYiXCY2XkM) an example from the app store on where to find the mint.

**Command**
```sh
yarn dev app
```

### Collectibles
For collectibles, you'll need a snapshot of holders. Tools like Foxyswap's [snapshot](https://famousfoxes.com/snapshot) make this easy. 

You'll then need to update the import within ``main.ts`` to target your list of holders.

**Command**
```sh
yarn dev collection
```

