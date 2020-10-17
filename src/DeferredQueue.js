
/**
 * id, job, dueAt, status, batchId (default '*')
 * uniqueKeys: [ job, batchId ]
 * 
 * todo: automatically create db structure if not exist
 */
class DeferredQueue {    
    constructor(app, storageModel, processTimeout) {
        this.app = app;
        this.storage = this.app.model(storageModel);
        this.processTimeout = processTimeout || 600000;
    }

    genreateBatchId() {
        const { Generators } = require('@genx/data');
        return Generators.shortid();
    }

    async postFutureJob_(job, deferedTime) {
        const now = this.app.now();
        const due = now.plus({ milliseconds: deferedTime || 3000 });

        const queuedJob = await this.storage.create_({
            job: JSON.stringify(job),
            dueAt: due,
            batchId: '*'
        }, null, {
            insertIgnore: true
        });

        return queuedJob;
    }

    async popExpiredJobs_() {
        const expired = this.app.now().minus({ milliseconds: this.processTimeout });
        const batchId = this.genreateBatchId();

        const updated = await this.storage.updateMany_({            
            batchId,
            lockFlag: true
        }, {
            $query: {
                batchId: { $neq: '*' },
                dispatchedAt: { $lte: expired },
                lockFlag: { $neq: true }
            },
            $retrieveUpdated: {
                $query: {
                    batchId
                }
            }
        });

        await this.removeByBatch_(batchId);

        return updated;
    }

    async markDueJobs_() {
        const now = this.app.now();
        const batchId = this.genreateBatchId();        

        const updated = await this.storage.updateMany_({            
            batchId,
            dispatchedAt: now
        }, {
            $query: {
                batchId: '*',
                dueAt: { $lte: now }
            },
            $retrieveUpdated: {
                $query: {
                    batchId
                }
            }
        });

        return updated;
    }

    async removeByBatch_(batchId) {
        await this.storage.deleteMany_({ batchId });
    }

    async removeById_(id) {
        await this.storage.deleteOne_(id);
    }

    async clearQueue_() {
        await this.storage.deleteAll_();
    }

    async getBatchStatus_() {
        const batchStats = await this.storage.findAll_({
            $projection: [
                'batchId',
                this.storage.db.connector.queryCount(null, "batchId")
            ],
            $query: {
                lockFlag: { $neq: 1 }
            },
            $groupBy: [
                'batchId'
            ],
            $skipOrm: true
        });

        console.log(batchStats);

        let pending = 0, processing = 0, batches = {};

        batchStats.forEach(batch => {
            if (batch[0] === '*') {
                pending = batch[1];
            } else {
                batches[batch[0]] = batch[1];
                processing += batch[1];
            }
        });

        return {
            numPending: pending,
            numProcessing: processing,
            batches
        };
    }
}

module.exports = DeferredQueue;