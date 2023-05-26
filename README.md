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

you can also run the collection command with an optional cache file:

**Command**
```sh
yarn dev collection -c data/userCache.json
```

The cache is saved automatically on every run, it contains a list of ids.

---

You can also specify the batch size and delay with either command:

**Command**
```sh
yarn dev collection -d 500 # 500 ms delay

yarn dev collection -b 10 # 10 batch size

yarn dev app -d 100 -b 5 # works on both app and collectible command
```


