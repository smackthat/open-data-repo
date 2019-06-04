const DataStore = artifacts.require('DataRepo');

module.exports = function (deployer) {
    deployer.deploy(DataStore);
};