'use strict';

// Express.js
const express = require('express');
const bodyParser = require('body-parser');
export const router = express.Router();

const formidable = require('formidable');
const fs = require('fs');
const hashUtils = require('./convertHash');
const Struct = require('./struct');

const ipfsClient = require('ipfs-http-client');
const ipfsCluster = require('ipfs-cluster-api');
const OrbitDB = require('orbit-db');
const Web3 = require('web3');
const DataStoreContract = require('../build/contracts/DataRepo.json');
const contract = require('truffle-contract');

// EITHER JS OR HTTP - CHOOSE
// const IPFS = require('ipfs');
// const ipfs = new IPFS({
// 	EXPERIMENTAL: {
// 		pubsub: true
// 	}
// });
const ipfs = ipfsClient('/ip4/192.168.99.101/tcp/9095');	// IPFS Cluster proxy -- for adding
const cluster = ipfsCluster('/ip4/192.168.99.101/tcp/9094');

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));	// Ganache test blockchain endpoint
// web3.eth.defaultAccount = web3.eth.accounts[0];

const DataRepo = contract(DataStoreContract);
DataRepo.setProvider(web3.currentProvider);

var orbitdb;
var contract1;	// DataRepo contract instance
var db;	// OrbitDB instance

var idIncrement = 0; // Just a dummy id for orbitdb (not a good way to go, but hey)

// Initiliaze orbitdb and data store contract

export async function init2() {
	console.log("Boomka! Dread lion!");
	// console.log('Web3: ', web3);
	// console.log(ipfs);
	try {
		// ipfs.on('ready', async () => {
		orbitdb = await OrbitDB.createInstance(ipfs);

		const dbConfig = {
			admin: ['*'],
			write: ['*'],
			indexBy: 'name'
		}
		db = await orbitdb.docs('aardvarkky');
		await db.load();

		// contract1 = contract(DataStoreContract);
		// // console.log(web3.currentProvider);
		// contract1.setProvider(web3.currentProvider);

		// contract1.deployed().then((instance) => {
		// 	console.log('Instance: ', instance);
		// });
		try {
			contract1 = await DataRepo.deployed();

			console.log("Hurraa!");
		} catch (e) {
			console.log(e);
		}


		// });

	} catch (e) {
		console.log(e);
	}

}

// db.events.on("write", (dbname, hash, entry) => {
// 	console.log(dbname);
// 	console.log(hash);
// 	console.log(entry);
// });

// API

router.post('/file/add', function (req, res1) {

	var timeStart = process.hrtime();

	var form = new formidable.IncomingForm();
	form.parse(req, (err, fields, files) => {

		if (err) res1.status(500).send(err);

		var fileBuffer = fs.readFileSync(files.File.path);
		var links = fields.links ? fields.links : [];

		// ipfs.add(fileBuffer, function (err, res) {
		cluster.add(fileBuffer, { 'replication-min': 1, 'replication-max': parseInt(fields.replMax) }, function (err, res) {
			if (err) res1.status(500).send(err);
			console.log('Saved: ', res[0]);

			// let hash = res[0].hash;
			let hash = res[0].path;
			let bytesFromHash = hashUtils.bytesFromHash(hash);

			contract1.save(bytesFromHash, { from: "0xcb2635c3269C45915c756E808054eEeAE927b75A" }).then((tx) => {
				let hashId = tx.logs[0].args._hashId.toNumber();

				db.put({ _id: fields.name, ethId: hashId, hash: hash, links: links, categories: fields.categories })
					.then((value) => {
						res1.status(200).send(value);

						console.log('Time: %ds', process.hrtime(timeStart)[0]);
					});
			});

		});
	});
});

router.patch('/file/:id', (req, res) => {

});

router.get('/list', (req, res) => {
	// TODO: kaikkien tietuiden hakeminen
	// käytetään query stringiä suodattamiseen: list?skip=0,take=20,...
	const list = db.get('');

	res.send(list);
});

// Getting the OrbitDB entry
router.get('/file/:id', (req, res) => {
	var timeStart = process.hrtime();
	// TODO: tietyn filun haku
	// req.params.id
	let id = req.params.id;

	const file = db.get(id)[0];

	res.status(200).send(file);
	console.log('Time: %ds', process.hrtime(timeStart)[0]);


});

// Getting the file
router.get('/file/:id/content', (req, res) => {
	var timeStart = process.hrtime();

	let id = req.params.id; // ipfs hash

	ipfs.cat(id, (err, file) => {
		if (err) res.status(500).send(err);

		res.status(200).send(file);
		console.log('Time: %ds', process.hrtime(timeStart)[0]);
	});

});

// Getting the eth log entty
router.get('/file/origin/:ethId', (req, res) => {
	var timeStart = process.hrtime();
	let foo = req.params.ethId;

	contract1.find(foo).then((data) => {
		console.log('Data: ', data);

		if (data[0] === "0x0000000000000000000000000000000000000000" || !data.hashContent) {
			res.status(500).send("No entry found!");
		}

		let hash = hashUtils.hashFromBytes(data.hashContent);
		let timeStamp = data.hashTimestamp;
		let address = data.hashSender;
		let dat = { ipfsHash: hash, times: timeStamp, sender: address };
		res.status(200).send(JSON.stringify(dat));

		console.log('Time: %ds', process.hrtime(timeStart)[0]);
	});
});

router.get('/peers', (req, res) => {
	ipfs.swarm.peers((err, peerss) => {
		if (err) res.status(500).send(err);
		console.log(peerss);
		res.send(peerss);
	});
});

router.get('/ipfsid', (req, res) => {
	ipfs.id(function (err, identity) {
		if (err) {
			throw err;
		}

		console.log(identity);
		res.send(identity);
	});

});


router.get('/ipfs/provs/:id', (req, res1) => {
	let hash = req.params.id;
	ipfs.dht.findProvs(hash, (err, res) => {
		if (err) res1.status(500).send(err);

		res1.send(res);
	});
});

// IPFS Cluster Service API  -- for debugging purposes mostly

router.get('/cpeers', (req, res) => {
	cluster.peers.ls((err, peers) => {
		if (err) res.status(500).send(err);

		res.status(200).send(peers);
	});
});

router.delete('/cpeers/remove/:id', (req, res) => {
	let id = req.params.id

	cluster.peers.rm(id, (err) => {
		if (err) res.status(500).send(err);

		res.status(204).send();
	});
});

router.get('/cpins', (req, res) => {
	cluster.pin.ls({ filter: 'all' }, (err, pins) => {
		if (err) res.send(err);

		res.send(pins);
	});
});

router.delete('/cpins/remove/:id', (req, res) => {
	let id = req.params.id;

	cluster.pin.rm(id, (err) => {
		if (err) res.status(500).send(err);

		res.status(200).send(id);
	})
});

