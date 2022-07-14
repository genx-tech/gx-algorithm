'use strict';

const path = require('path');
const { cmd } = require('@genx/sys');
const { sleep_ } = require('@genx/july');
const App = require('@genx/app');

const DeferredQueue = require('../DeferredQueue');

const WORKING_DIR = path.resolve(__dirname, '../../test/DeferredQueue');

describe('DeferredQueue', function () {
    let cliApp, queue;

    before(async function () {
        await cmd.run_(
            './node_modules/.bin/genx-eml build -c ./test/DeferredQueue/conf/app.default.json'
        );
        await cmd.run_(
            './node_modules/.bin/genx-eml migrate -c ./test/DeferredQueue/conf/app.default.json -r'
        );

        cliApp = new App('test server', {
            workingPath: WORKING_DIR,
            workerName: 'app',
            logger: {
                level: 'debug',
            },
        });

        await cliApp.start_();

        queue = new DeferredQueue(cliApp, 'test.Queue');
    });

    after(async function () {
        queue = null;
        await cliApp.stop_();
    });

    it('empty job', async function () {
        await queue.clearQueue_();

        const jobs = await queue.processDueRequests_();
        jobs.length.should.be.exactly(0);
    });

    it('post a job', async function () {
        await queue.clearQueue_();

        const job = await queue.postJobRequest_(
            {
                id: 'test',
                payload: 20,
            },
            1000
        );
        should.exist(job.id);
        job.batchId.should.be.exactly('*');

        let jobs = await queue.processDueRequests_();
        jobs.length.should.be.exactly(0);

        await sleep_(1500);

        jobs = await queue.processDueRequests_();
        jobs.length.should.be.exactly(1);
        should.exist(jobs[0].batchId);
        jobs[0].batchId.should.not.eql('*');
    });

    it('only one pending job with same type', async function () {
        await queue.clearQueue_();

        await queue.postJobRequest_(
            {
                id: 'test',
                payload: 20,
            },
            100
        );

        await queue.postJobRequest_(
            {
                id: 'test',
                payload: 20,
            },
            100
        );

        await sleep_(500);

        let jobs = await queue.processDueRequests_();
        jobs.length.should.be.exactly(1);
    });

    it('no limit with different type or param', async function () {
        await queue.clearQueue_();

        await queue.postJobRequest_(
            {
                id: 'test',
                payload: 20,
            },
            100
        );

        await queue.postJobRequest_(
            {
                id: 'test2',
                payload: 20,
            },
            100
        );

        await queue.postJobRequest_(
            {
                id: 'test',
                payload: 30,
            },
            100
        );

        await sleep_(500);

        let jobs = await queue.processDueRequests_();
        jobs.length.should.be.exactly(3);
    });

    it('expire', async function () {
        await queue.clearQueue_();

        queue.processTimeout = 500;

        await queue.postJobRequest_(
            {
                id: 'test',
                payload: 20,
            },
            500
        );

        await queue.postJobRequest_(
            {
                id: 'test2',
                payload: 20,
            },
            3000
        );

        await queue.postJobRequest_(
            {
                id: 'test',
                payload: 30,
            },
            500
        );

        let stats = await queue.getBatchStatus_();
        stats.numPending.should.be.exactly(3);
        stats.numProcessing.should.be.exactly(0);

        await sleep_(1000);

        await queue.processDueRequests_();

        stats = await queue.getBatchStatus_();

        stats.numPending.should.be.exactly(1);
        stats.numProcessing.should.be.exactly(2);

        let popped = await queue.popExpiredRequests_();
        popped.length.should.be.exactly(0);

        stats = await queue.getBatchStatus_();

        stats.numPending.should.be.exactly(1);
        stats.numProcessing.should.be.exactly(2);

        await sleep_(1000);

        popped = await queue.popExpiredRequests_();
        popped.length.should.be.exactly(2);

        stats = await queue.getBatchStatus_();
        console.log(stats);

        stats.numPending.should.be.exactly(1);
        stats.numProcessing.should.be.exactly(0);

        await sleep_(1500);

        const jobs = await queue.processDueRequests_();
        jobs.length.should.be.exactly(1);
    });
});
