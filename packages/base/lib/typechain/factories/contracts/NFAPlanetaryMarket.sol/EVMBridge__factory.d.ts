import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { EVMBridge, EVMBridgeInterface } from "../../../contracts/NFAPlanetaryMarket.sol/EVMBridge";
declare type EVMBridgeConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class EVMBridge__factory extends ContractFactory {
    constructor(...args: EVMBridgeConstructorParams);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<EVMBridge>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): EVMBridge;
    connect(signer: Signer): EVMBridge__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b50610373806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063a298c1d314610030575b600080fd5b61004a60048036038101906100459190610266565b61004c565b005b6100583384848461005d565b505050565b6001808111156100705761006f6102b9565b5b826001811115610083576100826102b9565b5b14156101615782600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166342842e0e856000846040518463ffffffff1660e01b815260040161012a93929190610306565b600060405180830381600087803b15801561014457600080fd5b505af1158015610158573d6000803e3d6000fd5b505050506101a2565b826000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505b50505050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006101d8826101ad565b9050919050565b6101e8816101cd565b81146101f357600080fd5b50565b600081359050610205816101df565b92915050565b6002811061021857600080fd5b50565b60008135905061022a8161020b565b92915050565b6000819050919050565b61024381610230565b811461024e57600080fd5b50565b6000813590506102608161023a565b92915050565b60008060006060848603121561027f5761027e6101a8565b5b600061028d868287016101f6565b935050602061029e8682870161021b565b92505060406102af86828701610251565b9150509250925092565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b6102f1816101cd565b82525050565b61030081610230565b82525050565b600060608201905061031b60008301866102e8565b61032860208301856102e8565b61033560408301846102f7565b94935050505056fea26469706673582212200363ff66bccf7d85ec1d4180995bcce7fc660b82809e2fe32d8fdf3bd5f1db7e64736f6c63430008090033";
    static readonly abi: {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: any[];
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): EVMBridgeInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): EVMBridge;
}
export {};
