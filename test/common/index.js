import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import fb from './fb';

global.expect = chai.expect;
global.fb = fb;
