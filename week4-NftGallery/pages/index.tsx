import type { NextPage } from 'next'
import React, { useState } from 'react'
import { NFTCard } from '../components/nftCard';

const Home: NextPage = () => {
  const [wallet, setWalletAddress] = useState("");
  const [collection, setCollectionAddress] = useState("");
  const [NFTs, setNFTs] = useState([]);
  const [fetchForCollection, setFetchForCollection] = useState(false);

  const walletHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(event.target.value);
  }

  const collectionHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCollectionAddress(event.target.value);
  }

  const fetchForCollectionHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFetchForCollection(event.target.checked);
  }

  const fetchNftsForAddress = async () => {
    let nfts;
    console.log("fetching nfts");
    const api_key = "dPjCp_Bc_jr-WhMYbWi8Q90ITFwnrTg1";
    const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${api_key}/getNFTs/`;
    let requestOptions = {
      method: "GET"
    };

    if (!collection.length) {
      const fetchURL = `${baseURL}?owner=${wallet}`;

      nfts = await fetch(fetchURL, requestOptions).then(data => data.json());
    } else {
      console.log("fetching nfts for collection owned by address");
      const fetchURL = `${baseURL}?owner=${wallet}&contractAddress%5B%5D=${collection}`;
      nfts = await fetch(fetchURL, requestOptions).then(data => data.json());
    }

    if (nfts) {
      console.log("nfts:", nfts);
      setNFTs(nfts.ownedNfts);
    }
  }

  const fetchNFTsForCollection = async () => {
    if (collection.length) {
      let requestOptions = {
        method: "GET"
      }
      const api_key = "dPjCp_Bc_jr-WhMYbWi8Q90ITFwnrTg1";
      const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${api_key}/getNFTsForCollection/`;
      const fetchURL = `${baseURL}?contractAddress=${collection}&withMetadata=${"true"}`;
      const nfts = await fetch(fetchURL, requestOptions).then(data => data.json());

      if (nfts) {
        console.log("NFTs in collection:", nfts);
        setNFTs(nfts.nfts);
      }
    }
  }

  const fetchNFTs = () => {
    fetchForCollection? fetchNFTsForCollection() : fetchNftsForAddress;
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-y-3">
     <div className="flex flex-col w-full justify-center items-center gap-y-2">
      <input disabled={fetchForCollection} onChange={walletHandler} type={"text"} value={wallet} placeholder="Add your wallet address" />
      <input onChange={collectionHandler} type={"text"} value={collection} placeholder="Add the collection address" />
      <label className='text-gray-600'><input onChange={fetchForCollectionHandler} type={"checkbox"} className="mr-2" />Fetch for collection</label>
      <button onClick={fetchNFTs} className={"disabled:bg-slate-500 text-white bg-blue-400 px-4 py-2 mt-3 rounded-sm w-1/5"}>Let's go! </button>
     </div>
     <div className='flex flex-wrap gap-y-12 mt-4 w-5/6 gap-x-2 justify-center'>
      {
        NFTs.length && NFTs.map(nft => {
          return (
            <NFTCard nft={nft} />
          );
        })
      }
     </div>
    </div>
  )
}

export default Home
