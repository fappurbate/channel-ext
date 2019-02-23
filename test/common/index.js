const Chai = require('chai');
const ChaiAsPromised = require('chai-as-promised');

Chai.use(ChaiAsPromised);

const fb = require('./fb');

global.expect = Chai.expect;
global.fb = fb;
