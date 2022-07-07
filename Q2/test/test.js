const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16, plonk } = require("snarkjs");

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {        
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        //generate the proof and public signals for the the input, wasmFile (circuit) and proving key file of the circuit
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");

        //show the output of the circuit that is the first position in the array of public signals in circom
        console.log('1x2 =',publicSignals[0]);
        
        //convert strings to BigInt in the publicSignals array
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        //convert strings of the proof to BigInt
        const editedProof = unstringifyBigInts(proof);
        //build the parameters concatenated with the proper format as calldata in Solidity 
        //for calling later the `verifyProof` function in the `HelloWorldVerifier` smart contract
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        //split the parameters in argv constant array, converting each parameter from BigInt to string
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        //function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[1] memory input) public view returns (bool r)
        const a = [argv[0], argv[1]]; //parameter a of the proof (G1Point) in the verifyProof function uint[2] 
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]]; //parameter b of the proof (G2Point) in the verifyProof function uint[2][2]
        const c = [argv[6], argv[7]]; //parameter c of the proof (G1Point) in the verifyProof function uint[2]
        const Input = argv.slice(8); //parameter input in the verifyProof function uint[1] (inputs)

        //we execute the `verifyProof` in the HelloWorldVerifier contract with the specified parameters 
        //and check that returns `true` for the verification of the proof
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("Multiplier3");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");

        console.log('1x2x3 =',publicSignals[0]);
        
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        //function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[1] memory input) public view returns (bool r)
        const a = [argv[0], argv[1]]; //parameter a of the proof (G1Point) in the verifyProof function uint[2] 
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]]; //parameter b of the proof (G2Point) in the verifyProof function uint[2][2]
        const c = [argv[6], argv[7]]; //parameter c of the proof (G1Point) in the verifyProof function uint[2]
        const Input = argv.slice(8); //parameter input in the verifyProof function uint[1] (inputs)

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("PlonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await plonk.fullProve({"a":"1","b":"2","c":"3"}, "contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3_plonk/circuit_final.zkey");

        console.log('1x2x3 =',publicSignals[0]);

        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await plonk.exportSolidityCallData(editedProof, editedPublicSignals);
        const argv = calldata.replace(/["[\]\s]/g, "").split(',');

        //function verifyProof(bytes memory proof, uint[] memory pubSignals) public view returns (bool)
        const p_proof = argv[0]; 
        const p_publicSignals = [argv[1]]; 

        expect(await verifier.verifyProof(p_proof, p_publicSignals)).to.be.true;
    });

    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let _proof = 0;
        let _pubSignals = [0];
        expect(await verifier.verifyProof(_proof, _pubSignals)).to.be.false;
    });
});