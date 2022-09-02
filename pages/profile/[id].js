import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import Head from "next/head";
import Image from "next/image";
// import of client and query
import { useState, useEffect } from "react";
// getPublicationsById for fetching all post and reposts 
import { client, getProfileById, getPublicationsById } from "../../api";
// import ABI for specific contract address
import ABI from "../../abi.json";
const CONTRACT_ADDRESS = "0x60Ae865ee4C725cd04353b5AAb364553f56ceF82"
//ether for commmunication with the contract
import { ethers } from 'ethers'


export default function Profile() {
    // for saving the profile data to state
    const [profile, setProfile] = useState();
    // to keep track of the posts in 
    const [pubs, setPubs] = useState([])
    // conncet state variablke to reference the connceted wallet
    const [accounts, setAccounts] = useState(null);

    // let users
    const router = useRouter();
    const { id } = router.query;
    useEffect(() => {
        if (id) {
        fetchProfile();
        }
    }, [id]);

    // funcion for fetching the profile data by its id
    async function fetchProfile(){
        try {
            const response = await client.query(getProfileById, { id }).toPromise();
            console.log("PROFILE:", response);
            setProfile(response.data.profile);
        
            const publications = await client.query(getPublicationsById, { id }).toPromise();
            console.log("PUBS!", publications);
            setPubs(publications.data.publications.items);
          } catch (error) {
            console.log("ERROR:", error);
          }
    }

    // functionality to conncet a wallet to the site
    async function connectWallet() {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log("accounts: ", accounts);
        setAccounts(accounts);
    }
    
    // functionality to follow a user button
    async function followUser() {
        // provider to allow to conncet through eth based wallte
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        // get the signer from provider which will be used to sign the transaction
        const signer = provider.getSigner();
        // object to interact with the LensHub smart contract
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        
        // try catch block if trasnaction/ interaction with contract fails
        try {
            // calling follow function from LensHub contract with sepcific parameters
          const tx = await contract.follow([id], [0x0]);
          // wait until transaction is done
          await tx.wait();
          console.log("Followed user successfully");
        } catch (err) {
          console.log("Failed to follow user due to", err);
        }
    }

    return (
        <Layout>
            <Head>
            <title>{profile ? profile.handle : "Lensbook"}</title>
            </Head>
            <div className="my-12">
            {profile && (
                <div className="flex flex-wrap md:flex-nowrap items-start w-full">
                    <div className="w-full md:w-auto mb-4 md:mr-8">
                        {profile.picture &&
                        profile.picture.original &&
                        profile.picture.original.url.includes("lens.infura-ipfs.io") ? (
                        <div className="relative w-60 h-60 bg-emerald-900 rounded mx-auto">
                            <Image
                            src={profile.picture.original.url}
                            layout="fill"
                            objectFit="cover"
                            alt={profile.handle}
                            className="rounded"
                            />
                        </div>
                        ) : (
                        <div className="bg-emerald-900 w-60 h-60 rounded mx-auto" />
                        )}
                    </div>
                    <div className="grow-1 w-full">
                        <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl sm:tracking-tight mb-1">
                            {profile.name}
                        </h1>
                        <h2 className="text-xl font-bold text-emerald-500 sm:text-2xl sm:tracking-tight mb-2">
                            {profile.handle}
                        </h2>
                        <div className="flex flex-wrap gap-x-2 text-gray-600 text-sm sm:text-base mb-4 justify-center md:justify-start">
                            <p>
                            <span className="text-gray-900 font-medium">
                                {profile.stats.totalFollowers}
                            </span>{" "}
                            Followers
                            </p>
                            <p>
                            <span className="text-gray-900 font-medium">
                                {profile.stats.totalFollowing}
                            </span>{" "}
                            Following
                            </p>
                        </div>
                        <p className="mb-4">{profile.bio}</p>
                        {/* Add connect and follow buttons here */}
                        {accounts ? (
                            <button
                                onClick={followUser}
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                                Follow {profile.handle}
                            </button>
                            ) : (
                            <button
                                onClick={connectWallet}
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                                Connect Wallet
                            </button>
                        )}
                        </div>
                        {/* Add publications here */}
                        {pubs.length > 0 && (
                        <div className="border-t-2 border-gray-100 my-8 py-8 flex flex-col space-y-8">
                            {pubs.map((p, index) => (
                            <div key={p.id}>
                                <p className="font-bold">{p.__typename}</p>
                                <p>{p.metadata.content}</p>
                                <p>{p.metadata.name}</p>
                            </div>
                            ))}
                        </div>
                        )}
                    </div>
                </div>
            )}
            </div>
      </Layout>
    );
}